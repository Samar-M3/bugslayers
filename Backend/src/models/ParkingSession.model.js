const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const parkingSessionSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: "User",
        required: true
    },
    parkingLot: {
        type: ObjectId,
        ref: "ParkingLot",
        required: true
    },
    vehicleType: {
        type: String,
        enum: ["car", "bike"],
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["active", "completed"],
        default: "active"
    }
}, { timestamps: true });

const ParkingSession = mongoose.model("ParkingSession", parkingSessionSchema);
module.exports = ParkingSession;
