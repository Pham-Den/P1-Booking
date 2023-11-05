const router = require("express").Router();
const userController = require("../controller/userController");

//USER REGISTER
router.post("/register", userController.postRegister);

//USER LOGIN
router.post("/login", userController.postLogin);

//////////////////////ADMIN/////////////
//GET ALL USER
router.get("/all", userController.getAllUser);

module.exports = router;
