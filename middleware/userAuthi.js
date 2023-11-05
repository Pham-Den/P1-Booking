const Users = require("../model/userModel");
const jwt = require("jsonwebtoken");

//permission dưới dạng mảng các role được phép truy cập ['isAmin', 'isMod']
//bài này không cần truyền permission
const userAuth = (permission) => {
  //return 1 middleware
  return async (req, res, next) => {
    //lấy token từ header - 'Bearer hjakjsjkdahshasdkjdsahjk'
    //nếu không có token thì báo login
    if (!req.get("Authorization")) {
      return res.status(401).json({ message: "Please login!" });
    }

    //lấy token
    const token = req.get("Authorization").split(" ")[1];

    //dùng cấu trúc để decoded
    //jwt.verify(token, 'shhhhh', function(err, decoded) {})

    let decoded;
    jwt.verify(token, process.env.SECRET_KEY, function (err, de) {
      //nếu có lỗi token thì return lỗi
      if (err) {
        return res.status(401).json({ message: err.message });
      }
      decoded = de;
    });
    console.log(decoded);
    //nếu decoded có thì thực hiện tiếp valid role
    if (decoded) {
      //tìm user theo jwt vừa gửi lên - để xác định có role hay không
      let userCurrent;
      //tìm trong User
      userCurrent = await Users.findById(decoded._id);

      //nếu không có thì báo không tìm thấy user
      if (!userCurrent) {
        return res.status(400).json({ message: "User Not Found!" });
      }
      //nếu role không nằm trong list thì báo lỗi
      if (!userCurrent.isAdmin) {
        return res.status(401).json({ message: "Not Permission!" });
      }

      //thoả mãn hết thì next
      // req.body._id = decoded._id;
      next();
    }
  };
};

module.exports = userAuth;
