const router = require("express").Router();
const roomController = require("../controller/roomController");

//get all room
router.get("/all", roomController.getAllRoom);

//post new room
router.post("/add", roomController.postNewRoom);

//post delete room
router.post("/delete/:id", roomController.postRemoveRoom);

//get room to edit
router.get("/detail/:id", roomController.getDetailRoom);

//update one room
router.post("/edit/:id", roomController.postEditRoom);

module.exports = router;
