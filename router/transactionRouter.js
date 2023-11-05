const router = require("express").Router();
const transactionController = require("../controller/transactionController");

///get dashboard info
router.get("/dashboard", transactionController.getInfoDashboard);

///get 8 trans
router.get("/get", transactionController.get8Transaction);

///get all trans
router.get("/all", transactionController.getAllTransaction);

///post one trans
router.post("/add", transactionController.postTransaction);

///get user trans
router.post("/user/:id_user", transactionController.getUserTransaction);

module.exports = router;
