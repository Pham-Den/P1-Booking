const express = require("express");
const env = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const userRouter = require("./router/userRouter");
const hotelRouter = require("./router/hotelRouter");
const transactionRouter = require("./router/transactionRouter");
const roomRouter = require("./router/roomRouter");

//
//env để đọc file .env
env.config();

//dùng body Parser để đọc json từ client
// app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

//use router
app.use("/api/user", userRouter);
app.use("/api/hotel", hotelRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/room", roomRouter);

//kết nối database mongoose
mongoose
  .connect(process.env.URL_MONGOOSE)
  .then(() => {
    console.log("Mongoose is connect!");
    //listen port
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log("Server is runing....");
    });
  })
  .catch((err) => console.log(err));
