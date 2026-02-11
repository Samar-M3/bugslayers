const ParkingLot = require("../models/ParkingLot.model");
const ParkingSession = require("../models/ParkingSession.model");

// Get all parking lots
exports.getAllParkingLots = async (req, res) => {
  try {
    const lots = await ParkingLot.find();
    res.status(200).json({ success: true, data: lots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active session for a user
exports.getActiveSession = async (req, res) => {
  try {
    const session = await ParkingSession.findOne({
      user: req.user._id,
      status: "active",
    }).populate("parkingLot");

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Start a parking session (Seed data or real booking)
exports.startSession = async (req, res) => {
  try {
    const { parkingLotId, vehicleType } = req.body;

    // Check if user already has an active session
    const existingSession = await ParkingSession.findOne({
      user: req.user._id,
      status: "active",
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: "User already has an active session",
      });
    }

    const session = await ParkingSession.create({
      user: req.user._id,
      parkingLot: parkingLotId,
      vehicleType,
    });

    // Increment occupied spots
    await ParkingLot.findByIdAndUpdate(parkingLotId, {
      $inc: { occupiedSpots: 1 },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete a parking session (Ends session and calculates revenue)
exports.completeSession = async (req, res) => {
  try {
    const session = await ParkingSession.findOne({
      user: req.user._id,
      status: "active",
    }).populate("parkingLot");

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "No active session found" });
    }

    const endTime = new Date();
    const startTime = new Date(session.startTime);
    const durationHours = Math.max(
      1,
      Math.ceil((endTime - startTime) / (1000 * 60 * 60)),
    );
    const totalAmount = durationHours * session.parkingLot.pricePerHour;

    session.endTime = endTime;
    session.totalAmount = totalAmount;
    session.status = "completed";
    await session.save();

    // Decrement occupied spots
    await ParkingLot.findByIdAndUpdate(session.parkingLot._id, {
      $inc: { occupiedSpots: -1 },
    });

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
