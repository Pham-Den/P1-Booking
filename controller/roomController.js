const Rooms = require("../model/roomModel");
const Transactions = require("../model/transactionModel");

const roomController = {
  /////////////////11. (Admin) Xem danh sách/Thêm/Xóa phòng////////////////////
  /////lấy toàn bộ phòng ///////
  getAllRoom: async (req, res) => {
    try {
      const allRooms = await Rooms.find();

      return res.status(200).json(allRooms);
    } catch (err) {
      return res.status(500).json(err.massage);
    }
  },

  //add new room
  postNewRoom: async (req, res) => {
    try {
      const dataForm = {
        title: req.body.title,
        desc: req.body.desc,
        price: req.body.price,
        maxPeople: req.body.maxPeople,
        roomNumbers: req.body.roomNumbers,
        hotel: req.body.hotel,
      };

      //valid data
      if (!dataForm.title || !dataForm.title.trim()) {
        return res.status(400).json({ message: "Please Input Title" });
      }
      if (!dataForm.desc || !dataForm.desc.trim()) {
        return res.status(400).json({ message: "Please Input Description" });
      }
      if (!dataForm.price || !dataForm.price.trim()) {
        return res.status(400).json({ message: "Please Input Price" });
      }
      if (!dataForm.maxPeople || !dataForm.maxPeople.trim()) {
        return res.status(400).json({ message: "Please Input Max People" });
      }
      if (!dataForm.roomNumbers || !dataForm.roomNumbers.length) {
        return res.status(400).json({ message: "Please Input Room Numbers" });
      }
      if (!dataForm.hotel || !dataForm.hotel.trim()) {
        return res.status(400).json({ message: "Please Input Hotel" });
      }

      //valid ok  thì tạo mới
      const newRoom = new Rooms(dataForm);
      await newRoom.save();

      return res.status(200).json({ message: "Successfully!" });
    } catch (err) {
      return res.status(500).json(err.massage);
    }
  },

  ///delete room
  postRemoveRoom: async (req, res) => {
    try {
      const idCurrent = req.params.id;

      //tìm room hiện tại
      const roomCurrent = await Rooms.findById(idCurrent);

      //nếu không có room thì báo lỗi
      if (!roomCurrent) {
        return res.status(400).json({ message: "Room Not Found!" });
      }

      // Khi xóa một phòng, bạn cần chắc chắn rằng phòng đó hiện không có khách nào book cả.
      //tìm tất cả giao dịch
      const allTransactions = await Transactions.find();

      //lọc các giao dịch có chưa room đó
      const transactionCurrent = allTransactions.filter((item) => {
        //nếu dò có thì trả về true - ban đầu cho false
        let result = false;
        ///item room lại là 1 mảng [{room_id, roomNumber}]
        item.room.forEach((r) => {
          if (r.room_id.equals(idCurrent)) {
            result = true;
          }
        });

        return result; //để lọc
      });
      //lọc các giao dịch vừa tìm được - có dateEnd > date Now
      const now = new Date();

      const transactionCurrentFilter = transactionCurrent.filter(
        (d) => new Date(d.dateEnd) >= now
      );
      //ok - tìm và xoá
      if (transactionCurrentFilter.length > 0) {
        return res.status(400).json({
          message:
            "This room cannot be deleted because there is currently a transaction!",
        });
      }

      //ok thì tìm xoá
      await Rooms.findByIdAndDelete(idCurrent);

      return res.status(200).json(transactionCurrentFilter);
    } catch (err) {
      return res.status(500).json(err.massage);
    }
  },

  // get room to edit
  getDetailRoom: async (req, res) => {
    try {
      const idRoom = req.params.id;

      const roomCurrent = await Rooms.findById(idRoom);

      if (!roomCurrent) {
        return res.status(400).josn({ message: "Room Not Found!" });
      }

      return res.status(200).json(roomCurrent);
    } catch (err) {
      return res.status(500).json(err.massage);
    }
  },

  // edit room
  postEditRoom: async (req, res) => {
    try {
      const idRoomCurrent = req.params.id;

      //tìm room đó trong database
      const roomCurrent = await Rooms.findById(idRoomCurrent);

      if (!roomCurrent) {
        return res.status(400).json({ message: "Room Not Found!" });
      }

      ///
      const dataForm = {
        title: req.body.title,
        desc: req.body.desc,
        price: req.body.price,
        maxPeople: req.body.maxPeople,
        roomNumbers: req.body.roomNumbers,
        hotel: req.body.hotel,
      };
      console.log(dataForm);
      //valid data
      if (!dataForm.title || !dataForm.title.trim()) {
        return res.status(400).json({ message: "Please Input Title" });
      }
      if (!dataForm.desc || !dataForm.desc.trim()) {
        return res.status(400).json({ message: "Please Input Description" });
      }
      if (!dataForm.price || !dataForm.price.trim()) {
        return res.status(400).json({ message: "Please Input Price" });
      }
      if (!dataForm.maxPeople || !dataForm.maxPeople.trim()) {
        return res.status(400).json({ message: "Please Input Max People" });
      }
      if (!dataForm.roomNumbers || !dataForm.roomNumbers.length) {
        return res.status(400).json({ message: "Please Input Room Numbers" });
      }
      if (!dataForm.hotel || !dataForm.hotel.trim()) {
        return res.status(400).json({ message: "Please Input Hotel" });
      }

      //valid ok
      //update vào database
      await roomCurrent.updateOne(dataForm);
      console.log("ok");

      return res.status(200).json({ message: "Successfully!" });
    } catch (err) {
      return res.status(500).json(err.massage);
    }
  },
};

module.exports = roomController;
