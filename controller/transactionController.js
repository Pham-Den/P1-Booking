const Transactions = require("../model/transactionModel");
const Hotels = require("../model/hotelModel");
const Users = require("../model/userModel");

const transactionController = {
  //get 8 Transaction tuỳ theo thông số page
  get8Transaction: async (req, res) => {
    try {
      //populate tới các ref
      const allTransaction = await Transactions.find()
        .sort({ createdAt: -1 })
        .populate(["hotel", "user"]);

      const page = req.query.page ? req.query.page : 1;
      console.log(page);

      const allTransactionFilter = allTransaction.slice(
        (page - 1) * 8,
        page * 8
      );

      if (allTransactionFilter.length === 0) {
        return res.status(400).json({ message: "No Transaction Found!" });
      }

      return res.status(200).json({
        total: allTransaction.length,
        results: allTransactionFilter,
        page: page,
      });
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  /////////////////// 12. (Admin) Xem toàn bộ giao dịch//////////////////
  //get all Transaction
  getAllTransaction: async (req, res) => {
    try {
      //populate tới các ref
      const allTransaction = await Transactions.find()
        .sort({ createdAt: -1 })
        .populate(["hotel", "user"]);

      if (allTransaction.length === 0) {
        return res.status(400).json({ message: "No Transaction Found!" });
      }
      return res.status(200).json(allTransaction);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },
  ///////////////////////7. (Client) Tạo giao diện book một khách sạn////////////////////////////
  //post transaction
  postTransaction: async (req, res) => {
    try {
      const dataTransaction = {
        user: req.body.user,
        hotel: req.body.hotel,
        room: req.body.room,
        dateStart: new Date(req.body.dateStart),
        dateEnd: new Date(req.body.dateEnd),
        price: req.body.price,
        payment: req.body.payment,
        status: "Booked",
      };
      // valid data

      if (!dataTransaction.user || !dataTransaction.user.trim()) {
        return res.status(400).json({ message: "Please Login!" });
      }
      //room lưu dưới dạng {room_id: roomid,roomNumbers: []}
      //vì khi xoá (xoá room_id) cần check xem nó có nằm trong giao dịch nào không
      //valid

      /////////////check xem có phòng trống trong khoản time đó không////////////
      //tìm tất cả transaction của hotel đó
      const transactionsHotelCurrent = await Transactions.find({
        hotel: dataTransaction.hotel.trim(),
      });
      //lọc lại các transaction theo dateStart và dateEnd (xem phòng nào đã được đặt)
      //hoặc là dateStart của các transaction nằm trong [dateStart, dateEnd] của khách đang đặt
      //hoặc là dateEnd của transaction nằm trong [dateStart, dateEnd] của khách đang đặt
      //hoặc là dateStart và dateEnd của các transaction nằm trong cả khoảng user chọn
      // => đều lấy
      const transactionsHotelCurrentFilter = transactionsHotelCurrent.filter(
        (d) =>
          (new Date(dataTransaction.dateStart) <= new Date(d.dateEnd) &&
            new Date(dataTransaction.dateStart) >= new Date(d.dateEnd)) ||
          (new Date(dataTransaction.dateEnd) <= new Date(d.dateEnd) &&
            new Date(dataTransaction.dateEnd) >= new Date(d.dateStart)) ||
          (new Date(dataTransaction.dateStart) >= new Date(d.dateStart) &&
            new Date(dataTransaction.dateEnd) <= new Date(d.dateEnd))
      );

      let result = false;
      console.log(transactionsHotelCurrentFilter);
      //nếu ks có giao dịch trong ngày đó thì check tiếp
      if (transactionsHotelCurrentFilter.length > 0) {
        //nếu khách chọn room không nằm trong list room này thì pass
        // duyệt qua các giao dịch - tìm vị trí của id room của user chọn
        transactionsHotelCurrentFilter.forEach((item) => {
          //lấy danh sách room đầu vào - duyệt qua, tìm index
          dataTransaction.room.forEach((e) => {
            const index = item.room.findIndex((d) =>
              d.room_id.equals(e.room_id)
            );

            //nếu index khác -1 thì không có giao dịch chứa phòng được chọn - nếu khác check tiếp
            if (index !== -1) {
              // tìm từng room chọn (e.roomNumbers) xem có nằm trong các giao dịch không (item.roomNumbers)
              e.roomNumbers.forEach((el) => {
                const i = item.room[index].roomNumbers.findIndex((ele) => {
                  console.log(ele, el);
                  return ele === el;
                });
                // có phòng thì trả về true
                if (i !== -1) {
                  result = true;
                }
              });
            }
          });
        });
      }
      console.log(result);
      //nếu result = true thì có phòng trong giao dịch - báo lỗi
      if (result) {
        return res.status(400).json({ message: "Room Not Available!" });
      }

      // add data
      const newTrans = new Transactions(dataTransaction);
      const transNew = await newTrans.save();

      // thêm id transction vào user và hotel
      const userCurrent = await Users.findById(dataTransaction.user);
      if (userCurrent) {
        await userCurrent.updateOne({ $push: { transactions: transNew._id } });
      }

      const hotelCurrent = await Hotels.findById(dataTransaction.hotel);
      if (hotelCurrent) {
        await hotelCurrent.updateOne({ $push: { transactions: transNew._id } });
      }

      return res.status(200).json({ message: "Successfully!" });
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  /////user xem giao dịch bản thân
  ///////////8. (Client) Hiển thị các giao dịch đã thực hiện////////////////
  getUserTransaction: async (req, res) => {
    try {
      const idCurrent = req.params.id_user;

      //sắp xếp theo ngày gần nhất - poputale những trường liên quan để hiển thị trong table
      const userCurrent = await Users.findById(idCurrent)
        .sort({ createdAt: -1 })
        .populate({
          path: "transactions",
          populate: { path: "hotel" },
        });
      console.log(userCurrent.transactions);

      return res.status(200).json(userCurrent.transactions);
    } catch (err) {
      return res.status(200).json(err.message);
    }
  },

  //////////////////9. (Admin) Xác thực và hiển thị Admin Dashboard////////////////////
  //api gồm: total user, total transaction, total doanh thu, tota doanh thu trung bình tháng

  getInfoDashboard: async (req, res) => {
    try {
      //tổng số user
      const allUser = await Users.find();
      const totalUser = allUser.length;

      //tổng số giao dịch
      const allTransaction = await Transactions.find();
      const totalTransaction = allTransaction.length;

      //tổng doanh thu
      let totalEarn = 0;
      allTransaction.forEach((e) => {
        totalEarn += Number(e.price);
      });

      //tổng doanh thu trung bình tháng - tính từ lúc tạo giao dịch (createAt), lấy 30 ngày về trước
      const now = new Date();

      //tạo ngày tháng từ now, lùi tháng lại 1
      const dateTarget = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );

      //lọc lấy giao dịch
      const transactionsFilter = allTransaction.filter(
        (e) => e.createdAt > dateTarget
      );
      //tính tổng doanh thu transactionsFilter
      let averageRevenue = 0;
      transactionsFilter.forEach((e) => {
        averageRevenue += Number(e.price);
      });

      //data phản hồi
      const dataRes = {
        totalUser,
        totalTransaction,
        totalEarn,
        averageRevenue,
      };
      return res.status(200).json(dataRes);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
};

module.exports = transactionController;
