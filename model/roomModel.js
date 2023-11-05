const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    maxPeople: {
      type: String,
      required: true,
    },
    roomNumbers: [
      {
        type: String,
        required: true,
      },
    ],
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotels",
    },
  },
  {
    timestamps: true,
  }
);

let Rooms = mongoose.model("Rooms", RoomSchema);

module.exports = Rooms;
