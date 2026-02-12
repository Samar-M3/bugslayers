const ParkingSession = require("../models/ParkingSession.model");
const ParkingLot = require("../models/ParkingLot.model");
const User = require("../models/User.model");
const SystemConfig = require("../models/SystemConfig.model");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalRevenue = await ParkingSession.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const activeSessions = await ParkingSession.countDocuments({
      status: "active",
    });
    const totalLots = await ParkingLot.countDocuments();
    const totalUsers = await User.countDocuments({ role: "driver" });

    // Calculate occupancy rate
    const lots = await ParkingLot.find();
    const totalSpots = lots.reduce((acc, lot) => acc + lot.totalSpots, 0);
    const occupiedSpots = lots.reduce((acc, lot) => acc + lot.occupiedSpots, 0);
    const occupancyRate =
      totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

    res.json({
      revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      activeSessions,
      totalLots,
      totalUsers,
      occupancyRate: Math.round(occupancyRate),
    });
  } catch (error) {
    next(error);
  }
};

exports.aiDetectParking = async (req, res, next) => {
  try {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulated AI detection results for major cities and hubs all over Nepal
    const detectedLots = [
      // KATHMANDU VALLEY
      {
        name: "AI: Kalimati Market Area",
        lat: 27.6981,
        lon: 85.2974,
        pricePerHour: 30,
        totalSpots: 40,
        type: "both",
      },
      {
        name: "AI: New Road Gate",
        lat: 27.7042,
        lon: 85.3117,
        pricePerHour: 50,
        totalSpots: 25,
        type: "bike",
      },
      {
        name: "AI: Pashupatinath Area",
        lat: 27.7104,
        lon: 85.3487,
        pricePerHour: 40,
        totalSpots: 100,
        type: "both",
      },
      {
        name: "AI: Koteshwor Junction",
        lat: 27.6766,
        lon: 85.3521,
        pricePerHour: 30,
        totalSpots: 50,
        type: "both",
      },
      {
        name: "AI: Maharajgunj Chowk",
        lat: 27.7371,
        lon: 85.3331,
        pricePerHour: 40,
        totalSpots: 60,
        type: "car",
      },
      {
        name: "AI: Patan Hospital Area",
        lat: 27.6684,
        lon: 85.3201,
        pricePerHour: 30,
        totalSpots: 80,
        type: "both",
      },
      {
        name: "AI: Bhaktapur Durbar Square Ent.",
        lat: 27.6722,
        lon: 85.4277,
        pricePerHour: 40,
        totalSpots: 120,
        type: "both",
      },

      // POKHARA
      {
        name: "AI: Pokhara Airport Area",
        lat: 28.1995,
        lon: 83.9856,
        pricePerHour: 50,
        totalSpots: 150,
        type: "car",
      },
      {
        name: "AI: Prithvi Chowk Pokhara",
        lat: 28.2091,
        lon: 83.9918,
        pricePerHour: 30,
        totalSpots: 100,
        type: "both",
      },
      {
        name: "AI: Sarangkot Viewpoint",
        lat: 28.2439,
        lon: 83.9486,
        pricePerHour: 40,
        totalSpots: 40,
        type: "both",
      },

      // CHITWAN / BHARATPUR
      {
        name: "AI: Bharatpur Hospital Area",
        lat: 27.6806,
        lon: 84.4302,
        pricePerHour: 20,
        totalSpots: 200,
        type: "both",
      },
      {
        name: "AI: Narayangarh Riverside",
        lat: 27.7028,
        lon: 84.4255,
        pricePerHour: 30,
        totalSpots: 80,
        type: "both",
      },
      {
        name: "AI: Sauraha Tourist Bus Park",
        lat: 27.5833,
        lon: 84.4952,
        pricePerHour: 40,
        totalSpots: 100,
        type: "car",
      },

      // BIRATNAGAR / ITahari
      {
        name: "AI: Biratnagar Airport Parking",
        lat: 26.4839,
        lon: 87.2667,
        pricePerHour: 50,
        totalSpots: 120,
        type: "car",
      },
      {
        name: "AI: Itahari Main Chowk",
        lat: 26.6647,
        lon: 87.2719,
        pricePerHour: 20,
        totalSpots: 150,
        type: "both",
      },
      {
        name: "AI: Dharan Bhanu Chowk",
        lat: 26.8128,
        lon: 87.2831,
        pricePerHour: 25,
        totalSpots: 80,
        type: "both",
      },

      // BUTWAL / BHAIRAHAWA
      {
        name: "AI: Butwal Traffic Chowk",
        lat: 27.7006,
        lon: 83.4484,
        pricePerHour: 20,
        totalSpots: 120,
        type: "both",
      },
      {
        name: "AI: Lumbini Garden Gate",
        lat: 27.4811,
        lon: 83.2758,
        pricePerHour: 50,
        totalSpots: 300,
        type: "both",
      },
      {
        name: "AI: Gautam Buddha Airport",
        lat: 27.5083,
        lon: 83.4158,
        pricePerHour: 60,
        totalSpots: 250,
        type: "car",
      },

      // JANAKPUR / NEPALGUNJ
      {
        name: "AI: Janakpurdham Temple Area",
        lat: 26.7303,
        lon: 85.9248,
        pricePerHour: 30,
        totalSpots: 150,
        type: "both",
      },
      {
        name: "AI: Nepalgunj Birendra Chowk",
        lat: 28.05,
        lon: 81.6167,
        pricePerHour: 25,
        totalSpots: 100,
        type: "both",
      },
    ];

    const addedLots = [];
    for (const lot of detectedLots) {
      // Only add if not already present
      const existing = await ParkingLot.findOne({
        lat: { $gt: lot.lat - 0.001, $lt: lot.lat + 0.001 },
        lon: { $gt: lot.lon - 0.001, $lt: lot.lon + 0.001 },
      });

      if (!existing) {
        const newLot = await ParkingLot.create({
          ...lot,
          occupiedSpots: Math.floor(Math.random() * lot.totalSpots),
          status: "available",
        });
        addedLots.push(newLot);
      }
    }

    res.json({
      success: true,
      message: `AI Scan complete. Detected ${detectedLots.length} locations, added ${addedLots.length} new parking lots.`,
      data: addedLots,
    });
  } catch (error) {
    console.error("AI Detection Error:", error);
    next(error);
  }
};

exports.getRevenueTrends = async (req, res, next) => {
  try {
    // Get revenue for the last 24 hours, grouped by hour
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trends = await ParkingSession.aggregate([
      {
        $match: {
          status: "completed",
          endTime: { $gte: oneDayAgo },
        },
      },
      {
        $group: {
          _id: { $hour: "$endTime" },
          amount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format for frontend (ensuring all 24 hours are present if needed,
    // but for now just returning what we have)
    const formattedTrends = trends.map((item) => ({
      time: `${item._id.toString().padStart(2, "0")}:00`,
      amount: item.amount,
    }));

    res.json(formattedTrends);
  } catch (error) {
    next(error);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const activities = await ParkingSession.find()
      .populate("user", "name email")
      .populate("parkingLot", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedActivities = activities.map((session) => ({
      id: session._id,
      plate: session.user ? session.user.name : "Unknown", // Assuming name is used as plate for now or user has plate
      time: new Date(session.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: session.vehicleType.toUpperCase(),
      amount: session.totalAmount > 0 ? `NPR ${session.totalAmount}` : "NPR 0",
      status: session.status.toUpperCase(),
      parkingLot: session.parkingLot ? session.parkingLot.name : "Unknown",
    }));

    res.json(formattedActivities);
  } catch (error) {
    next(error);
  }
};

// CRUD for Parking Lots
exports.getAllLots = async (req, res, next) => {
  try {
    const lots = await ParkingLot.find().sort({ createdAt: -1 });
    res.json(lots);
  } catch (error) {
    next(error);
  }
};

exports.addParkingLot = async (req, res, next) => {
  console.log("Add Parking Lot Request Body:", req.body);
  try {
    const { name, lat, lon, pricePerHour, totalSpots, type } = req.body;

    // 1. Check for required fields
    if (
      !name ||
      lat === undefined ||
      lon === undefined ||
      pricePerHour === undefined ||
      totalSpots === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, lat, lon, pricePerHour, and totalSpots are mandatory.",
      });
    }

    // 2. Validate numeric inputs
    const numLat = Number(lat);
    const numLon = Number(lon);
    const numPrice = Number(pricePerHour);
    const numSpots = Number(totalSpots);

    if (isNaN(numLat) || isNaN(numLon) || isNaN(numPrice) || isNaN(numSpots)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid numeric input. lat, lon, pricePerHour, and totalSpots must be valid numbers.",
      });
    }

    // 3. Validate type
    const validTypes = ["car", "bike", "both"];
    const finalType = type || "both";
    if (!validTypes.includes(finalType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be one of: car, bike, both.",
      });
    }

    const newLot = await ParkingLot.create({
      name,
      lat: numLat,
      lon: numLon,
      pricePerHour: numPrice,
      totalSpots: numSpots,
      occupiedSpots: 0,
      status: "available",
      type: finalType,
    });

    res.status(201).json({
      success: true,
      data: newLot,
    });
  } catch (error) {
    console.error("Add Lot Error:", error);
    next(error);
  }
};

exports.deleteParkingLot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lot = await ParkingLot.findByIdAndDelete(id);
    if (!lot) {
      return res.status(404).json({ message: "Parking lot not found" });
    }
    res.json({ message: "Parking lot deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.updateParkingLot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedLot = await ParkingLot.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedLot) {
      return res.status(404).json({ message: "Parking lot not found" });
    }
    res.json(updatedLot);
  } catch (error) {
    next(error);
  }
};

exports.getSystemConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    res.json(config);
  } catch (error) {
    next(error);
  }
};

exports.updateSystemConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create(req.body);
    } else {
      config = await SystemConfig.findByIdAndUpdate(config._id, req.body, {
        new: true,
      });
    }
    res.json({
      success: true,
      message: "System configuration updated successfully",
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// User Management
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: { $ne: "superadmin" } })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
