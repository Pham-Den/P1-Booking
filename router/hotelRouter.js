const router = require("express").Router();
const hotelController = require("../controller/hotelController");
const userAuthi = require("../middleware/userAuthi");

//get all hotel
router.get("/all-info", hotelController.getInfoAllHotel);

//search hotel
router.post("/search", hotelController.postSearchHotel);

//get one hotel
router.get("/detail/:id", hotelController.getOneHotel);

//////////////////////admin////////////////////
//get all hotel
router.get(
  "/all",
  //  userAuthi(),
  hotelController.getAllHotel
);

//post add one hotel
router.post("/add", hotelController.postHotel);

//post add one hotel
router.post("/delete/:id", hotelController.deleteHotel);

//get hotel to Update
router.get("/edit/:id", hotelController.getHotelToEdit);
//update one hotel
router.post("/edit/:id", hotelController.postEditHotel);

module.exports = router;
