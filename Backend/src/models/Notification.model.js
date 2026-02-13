const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["checkin", "checkout", "info"],
      default: "info",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      parkingLot: {
        type: ObjectId,
        ref: "ParkingLot",
      },
      session: {
        type: ObjectId,
        ref: "ParkingSession",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

//this is notificaiton model
module.exports = mongoose.model("Notification", notificationSchema);

