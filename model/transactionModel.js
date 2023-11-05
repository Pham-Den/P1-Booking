const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotels",
      required: true,
    },
    room: [
      {
        room_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Rooms",
        },
        roomNumbers: [
          {
            type: String,
          },
        ],
      },
    ],
    dateStart: {
      type: String,
      required: true,
    },
    dateEnd: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    payment: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

let Transaction = mongoose.model("Transactions", transactionSchema);

module.exports = Transaction;
