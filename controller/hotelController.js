const Hotels = require("../model/hotelModel");
const Transactions = require("../model/transactionModel");

//import roommodel mới populate được ???
const Rooms = require("../model/roomModel");

const hotelController = {
  /////////////////4. (Client) Hiển thị thông tin ở Homepage/////////////////////
  ////////////////////user//////////////////////
  //get all hotel - theo yc
  getInfoAllHotel: async (req, res) => {
    try {
      // /////////////API trả về/////////////////
      // Số lượng các khách sạn theo khu vực: Hà Nội, HCM và Đà Nẵng.
      // Số lượng khách sạn theo từng loại.
      // Top 3 khách sạn có rating cao nhất.
      // => phản hồi sẽ là
      //  {
      // city: {totalHN, totalHCM, totalDN},
      // type {totalHotel, totalApartment, totalResort, totalVillas, totalCabin},
      // topRating: []
      // }

      //tất cả hotel - sắp xếp theo rating
      const allHotels = await Hotels.find().sort({ rating: -1 });

      //lấy 3 hotel top rating
      const topRating = allHotels.slice(0, 3);

      //lọc theo từng khu vực
      const totalHN = allHotels.filter(
        (d) => d.city.toLowerCase() === "ha noi"
      ).length;
      const totalHCM = allHotels.filter(
        (d) => d.city.toLowerCase() === "ho chi minh"
      ).length;
      const totalDN = allHotels.filter(
        (d) => d.city.toLowerCase() === "da nang"
      ).length;

      //lọc theo từng thể loại - tính tổng
      const totalHotel = allHotels.filter(
        (d) => d.type.toLowerCase() === "hotel"
      ).length;
      const totalApartments = allHotels.filter(
        (d) => d.type.toLowerCase() === "apartments"
      ).length;
      const totalResorts = allHotels.filter(
        (d) => d.type.toLowerCase() === "resorts"
      ).length;
      const totalVillas = allHotels.filter(
        (d) => d.type.toLowerCase() === "villas"
      ).length;
      const totalCabins = allHotels.filter(
        (d) => d.type.toLowerCase() === "cabins"
      ).length;

      //trả về data
      const dataRes = {
        city: { totalHN, totalHCM, totalDN },
        type: {
          totalHotel,
          totalApartments,
          totalResorts,
          totalVillas,
          totalCabins,
        },
        topRating: topRating,
      };

      res.status(200).json(dataRes);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  //tìm kiếm
  /////////////////////5. (Client) Tìm kiếm khách sạn phù hợp//////////////
  postSearchHotel: async (req, res) => {
    try {
      // Tìm kiếm theo khu vực muốn ở (city)
      // Tìm kiếm theo thời gian muốn ở (thời gian có phòng trống)
      // Số lượng người ở, số lượng phòng (đủ phòng)
      const searchData = {
        city: req.body.destination,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        adult: Number(req.body.adult),
        children: Number(req.body.children),
        room: Number(req.body.room),
      };

      //lấy tất cả hotel - populate các trường liên quan để filter các thông số tìm kiếm
      const allHotels = await Hotels.find()
        .populate("rooms")
        .populate({
          path: "transactions",
          populate: {
            path: "room",
            populate: "room_id",
          },
        });

      //////////tìm data phù hợp (filter)///////
      //ban đầu filter = tất cả hotel
      let hotelFilter = [...allHotels];

      ////////////////////nếu user có nhập city thì lọc theo city /////////////////
      if (searchData.city) {
        hotelFilter = allHotels.filter(
          (data) =>
            data.city.toLowerCase() === searchData.city.trim().toLowerCase()
        );
      }

      ////////////////////END - tìm theo city /////////////////
      //////////////////////lọc tiếp tục theo thông số khác//////////////
      //trong khoảng thời gian tìm kiếm - ks có phòng trống phù hợp và (roomnumber * maxPeople > adult + children)

      const hotelFilter1 = hotelFilter.filter((hotel) => {
        //đang trong 1 hotel - nếu không thoả dk thì trả về false (không filter)
        //tìm số phòng trống - sức chứa tối đa - và số phòng tối thiểu phải đặt
        const totalPeople = searchData.children + searchData.adult;
        let roomFree = 0;
        let suc_chua_toi_da = 0;
        //ban đầu cho sức chứa 1 phòng 1 người
        let min_room = totalPeople;

        //duyệt qua các rooms tổng từ ks vừa tìm được, và lấy các số tổng
        hotel.rooms.forEach((r) => {
          roomFree = roomFree + r.roomNumbers.length;
          suc_chua_toi_da =
            suc_chua_toi_da + r.roomNumbers.length * r.maxPeople;

          //lấy giá trị nhỏ hơn của min_room (số phòng tối thiểu phải đặt)
          min_room =
            totalPeople / r.maxPeople < min_room
              ? totalPeople / r.maxPeople
              : min_room;
        });
        // console.log(roomFree, suc_chua_toi_da, min_room);
        ///////tất cả các giao dịch của từng hotel nếu có
        //dựa vào giao dịch này để tìm ra các phòng đã bị đặt trong thời gian khách tìm kiếm
        const transactions = hotel.transactions;

        //nếu có giao dịch thì duyệt qua mảng giao dịch - và cập nhật lại tổng số phòng trong thời gian có giao dịch
        if (transactions.length > 0) {
          transactions.map((t) => {
            // trong 1 transaction
            //nếu có giao dịch nằm trong thời gian thì xem tất cả các phòng thì trừ các phòng được giao dịch ra
            //chỉ cần có ngày bắt đầu hoặc ngày kết thúc lọt vào ngày của giao dịch
            if (
              (new Date(searchData.startDate) >= new Date(t.dateStart) &&
                new Date(searchData.startDate) <= new Date(t.dateEnd)) ||
              (new Date(searchData.endDate) >= new Date(t.dateStart) &&
                new Date(searchData.endDate) <= new Date(t.dateEnd)) ||
              (new Date(searchData.startDate) <= new Date(t.dateStart) &&
                new Date(searchData.endDate) >= new Date(t.dateEnd))
            ) {
              //tìm phòng trong giao dịch đó - lấy sức chứa của phòng đó và số phòng được đặt
              //lấy list room được đặt từ transaction;
              roomList = t.room;
              console.log(roomList);
              roomList.map((item) => {
                //phòng trống trừ phòng đã đặt ra
                roomFree = roomFree - item.roomNumbers.length;
                suc_chua_toi_da = suc_chua_toi_da - item.room_id.maxPeople;
              });
              //chỗ này cần update lại min_room (chưa biết làm)
            }
          });
        }
        console.log(roomFree);
        ///////////////////nếu số room, số người và sức chứa phù hợp không thoả thì bỏ qua ks (return = false) này//////////////
        if (
          searchData.room > roomFree ||
          searchData.adult + searchData.children > suc_chua_toi_da ||
          min_room > searchData.room
        ) {
          return false;
        }

        /////////////////nếu qua hết các điều kiện thì trả về true(lấy ks này)///////////
        return true;
      });
      //////////////////////END - tìm theo thông số khác//////////////

      ////////////////phản hồi kết quả////////
      return res.status(200).json(hotelFilter1);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  //////////////6. (Client) Hiển thị thông tin cụ thể của một khách sạn///////////////
  /////////////7. (Client) Tạo giao diện book một khách sạn//////////////////////
  ////////////nhấn "Reserve Now" - sendData phần transaction///////////////////////
  //get One Hotel
  getOneHotel: async (req, res) => {
    try {
      const idCurrent = req.params.id;

      // //dùng chung link api với
      // let hotelCurrent;
      // if (!idCurrent) {
      //   hotelCurrent = await Hotels.findById().populate("rooms");
      // }
      //tìm trong database
      const hotelCurrent = await Hotels.findById(idCurrent)
        .populate("rooms")
        .populate({
          path: "transactions",
          populate: {
            path: "room",
          },
        });
      //nếu tìm không có
      if (!hotelCurrent) {
        return res.status(400).json({ message: "Hotel not found!" });
      }

      //nếu có thì trả về
      return res.status(200).json(hotelCurrent);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  ///////////////////////ADMIN///////////////////// (10.Xem danh sách/Thêm/Xóa khách sạn)
  // API để lấy toàn bộ danh sách khách sạn hiện có
  //get all Hotel
  getAllHotel: async (req, res) => {
    try {
      //tìm trong database
      const allHotel = await Hotels.find();

      //nếu có thì trả về
      return res.status(200).json(allHotel);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },
  //add Hotel
  postHotel: async (req, res) => {
    try {
      //lấy data từ user
      const dataHotel = {
        //
        name: req.body.name,
        title: req.body.title,
        type: req.body.type,
        city: req.body.city,
        address: req.body.address,
        distance: req.body.distance,
        photos: req.body.photos,
        desc: req.body.desc,
        rating: req.body.rating,
        cheapestPrice: req.body.cheapestPrice,
        rating: req.body.rating,
        featured: req.body.featured,
        rooms: req.body.rooms,
      };

      //valid
      if (!dataHotel.name || !dataHotel.name.trim()) {
        return res.status(400).json({ message: "Please Input Hotel Name!" });
      }
      if (!dataHotel.title || !dataHotel.title.trim()) {
        return res.status(400).json({ message: "Please Input Hotel Title!" });
      }
      if (!dataHotel.type || !dataHotel.type.trim()) {
        return res.status(400).json({ message: "Please Input Hotel Type!" });
      }
      if (!dataHotel.city || !dataHotel.city.trim()) {
        return res.status(400).json({ message: "Please Input City!" });
      }
      if (!dataHotel.address || !dataHotel.address.trim()) {
        return res.status(400).json({ message: "Please Input Address!" });
      }
      if (!dataHotel.cheapestPrice || !dataHotel.cheapestPrice.trim()) {
        return res.status(400).json({ message: "Please Input Price!" });
      }
      if (!dataHotel.rating || !dataHotel.rating.trim()) {
        return res.status(400).json({ message: "Please Input Rating!" });
      }
      if (!dataHotel.distance || !dataHotel.distance.trim()) {
        return res.status(400).json({ message: "Please Input Distance!" });
      }
      if (!dataHotel.photos || dataHotel.photos.length === 0) {
        return res.status(400).json({ message: "Please Input Photos!" });
      }
      if (!dataHotel.desc || !dataHotel.desc.trim()) {
        return res.status(400).json({ message: "Please Input Description!" });
      }
      if (!dataHotel.featured || !dataHotel.featured.trim()) {
        return res.status(400).json({ message: "Please Input Featured!" });
      }
      if (!dataHotel.rooms || dataHotel.rooms.length === 0) {
        return res.status(400).json({ message: "Please Input Rooms!" });
      }

      //ok tạo mới

      const newHotel = new Hotels(dataHotel);
      await newHotel.save();

      //nếu có thì trả về
      return res.status(200).json({ message: "Successfully!" });
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  // API để xóa một khách sạn theo id
  //delete Hotel
  deleteHotel: async (req, res) => {
    try {
      //lấy id hotel
      const idCurrent = req.params.id;

      //tìm xem hotel có tồn tại không
      const hotelCurrent = await Hotels.findById(idCurrent);

      ///valid hotel
      if (!hotelCurrent) {
        return res.status(400).json({ message: "The Hotel Does Not Exist!" });
      }

      //đồng thời cũng phải kiểm tra khách sạn đó đã nằm trong bất cứ giao dịch nào chưa, nếu có thì không được xóa và đưa ra thông báo cho người dùng.
      //tìm tất cả giao dịch hotel này có
      const transactionHotelCurrent = await Transactions.find({
        hotel: hotelCurrent._id,
      });

      //đó là đề bài - còn nếu muốn xoá ks khi hiện tại không có giao dịch nào thì xét dateEnd
      //nếu có thì lọc xem có giao dịch có nằm trong khoảng thời gian hiện tại không (so sánh dateEnd có lớn hơn hiện tại không)
      // const dateNow = new Date();
      // const transactionHotelCurrentFilter = transactionHotelCurrent.filter(
      //   (d) => new Date(d.dateEnd) > dateNow
      // );

      //nếu có khách sạn thì báo lỗi
      if (transactionHotelCurrent.length > 0) {
        return res.status(400).json({
          message:
            "The current hotel cannot be deleted because there is a transaction!",
        });
      }
      //ok thì tìm và xóa theo id
      await Hotels.findByIdAndRemove(idCurrent);

      //phản hồi
      return res.status(200).json({ message: "Successfully!" });
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  //put Hotel
  postEditHotel: async (req, res) => {
    try {
      const idHotelCurrent = req.params.id;
      //tìm theo id
      const hotelCurrent = await Hotels.findById(idHotelCurrent);

      if (!hotelCurrent) {
        return res.status(400).json({ message: "Hotel Not Found!" });
      }
      //lấy data từ user
      const dataHotel = {
        //
        name: req.body.name,
        title: req.body.title,
        type: req.body.type,
        city: req.body.city,
        address: req.body.address,
        distance: req.body.distance,
        cheapestPrice: req.body.cheapestPrice,
        photos: req.body.photos,
        desc: req.body.desc,
        rating: req.body.rating,
        featured: req.body.featured,
        rooms: req.body.rooms,
      };

      //valid
      if (!dataHotel.name || !dataHotel.name.trim()) {
        return res.status(400).json({ message: "Please Input Hotel Name!" });
      }
      if (!dataHotel.title || !dataHotel.title.trim()) {
        return res.status(400).json({ message: "Please Input Hotel Title!" });
      }
      if (!dataHotel.type || !dataHotel.type.trim()) {
        return res.status(400).json({ message: "Please Input Hotel Type!" });
      }
      if (!dataHotel.city || !dataHotel.city.trim()) {
        return res.status(400).json({ message: "Please Input City!" });
      }
      if (!dataHotel.address || !dataHotel.address.trim()) {
        return res.status(400).json({ message: "Please Input Address!" });
      }
      if (!dataHotel.cheapestPrice || !dataHotel.cheapestPrice.trim()) {
        return res.status(400).json({ message: "Please Input Price!" });
      }
      if (!dataHotel.distance || !dataHotel.distance.trim()) {
        return res.status(400).json({ message: "Please Input Distance!" });
      }
      if (!dataHotel.photos || dataHotel.photos.length === 0) {
        return res.status(400).json({ message: "Please Input Photos!" });
      }
      if (!dataHotel.desc || !dataHotel.desc.trim()) {
        return res.status(400).json({ message: "Please Input Description!" });
      }
      if (!dataHotel.featured || !dataHotel.featured.trim()) {
        return res.status(400).json({ message: "Please Input Featured!" });
      }
      if (!dataHotel.rooms || dataHotel.rooms.length === 0) {
        return res.status(400).json({ message: "Please Input Rooms!" });
      }
      //valid ok

      //update vào database
      await hotelCurrent.updateOne(dataHotel);

      //phản hồi
      return res.status(200).json({ message: "Successfully!" });
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  ////get hotel to edit
  getHotelToEdit: async (req, res) => {
    try {
      const idHotel = req.params.id;
      const hotelCurrent = await Hotels.findById(idHotel).populate("rooms");

      if (!hotelCurrent) {
        return res.status(400).json({ message: "Hotel Not Found!" });
      }

      //
      return res.status(200).json(hotelCurrent);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },
};

module.exports = hotelController;
