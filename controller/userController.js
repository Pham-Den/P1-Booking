const Users = require("../model/userModel");
const jwt = require("jsonwebtoken");

const userController = {
  //post user register
  postRegister: async (req, res) => {
    try {
      const dataRegister = {
        username: req.body.username,
        password: req.body.password,
      };

      //valid data
      if (!dataRegister.username.trim()) {
        return res.status(400).json({ message: "Please Input Email!" });
      }
      if (!dataRegister.username.includes("@")) {
        return res.status(400).json({ message: "Please Input Email Correct!" });
      }
      if (!dataRegister.password.trim()) {
        return res.status(400).json({ message: "Please Input Password!" });
      }
      if (dataRegister.password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password Must Be From 8 Characters or More!" });
      }

      //tìm xem email tồn tại chưa
      const userCurrent = await Users.find({ username: dataRegister.username });

      //trả về mảng data
      if (userCurrent.length > 0) {
        return res.status(400).json({ message: "Username Is Exists!" });
      }

      //valid ok
      const userNew = new Users(dataRegister);
      const newUser = await userNew.save();

      return res.status(200).json(newUser);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  //post user login - cấp token jwt
  postLogin: async (req, res) => {
    try {
      const dataLogin = {
        username: req.body.username,
        password: req.body.password,
      };

      console.log(dataLogin);
      //valid data
      if (!dataLogin.username.trim()) {
        return res.status(400).json({ message: "Please Input Email!" });
      }
      if (!dataLogin.password.trim()) {
        return res.status(400).json({ message: "Please Input Password!" });
      }

      //tìm xem có username tồn tại chưa
      const userCurrent = await Users.find({ username: dataLogin.username });

      //trả về mảng data
      if (userCurrent.length === 0) {
        return res.status(400).json({ message: "Username Is Not Exists!" });
      }
      if (userCurrent[0].password !== dataLogin.password) {
        return res.status(400).json({ message: "Password Is Not Correct!" });
      }

      //valid ok
      //tạo token gửi user
      const { password, ...dataJWT } = userCurrent[0]._doc; //lấy hết data ngoại trừ password

      //tạo token
      const jwt_token = jwt.sign(dataJWT, process.env.SECRET_KEY);
      const results = {
        jwt_token: jwt_token,
        user: dataJWT,
      };
      console.log(dataJWT);

      return res.status(200).json(results);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },

  /////////////////////admin/////////////////////////
  getAllUser: async (req, res) => {
    try {
      const allUser = await Users.find();

      return res.status(200).json(allUser);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  },
};

module.exports = userController;
