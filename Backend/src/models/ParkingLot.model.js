const mongoose = require("mongoose");

const parkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lon: {
      type: Number,
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
    totalSpots: {
      type: Number,
      required: true,
    },
    occupiedSpots: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["car", "bike", "both"],
      default: "both",
    },
    status: {
      type: String,
      enum: ["available", "full"],
      default: "available",
    },
  },
  { timestamps: true },
);

// Pre-save hook to update status based on occupancy
parkingLotSchema.pre("save", function (next) {
  if (this.occupiedSpots >= this.totalSpots) {
    this.status = "full";
  } else {
    this.status = "available";
  }
  next();
});

const ParkingLot = mongoose.model("ParkingLot", parkingLotSchema);
module.exports = ParkingLot;
