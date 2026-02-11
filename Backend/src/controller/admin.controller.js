const ParkingSession = require("../models/ParkingSession.model");
const ParkingLot = require("../models/ParkingLot.model");
const User = require("../models/User.model");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalRevenue = await ParkingSession.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const activeSessions = await ParkingSession.countDocuments({ status: "active" });
    const totalLots = await ParkingLot.countDocuments();
    const totalUsers = await User.countDocuments({ role: "buyer" });

    // Calculate occupancy rate
    const lots = await ParkingLot.find();
    const totalSpots = lots.reduce((acc, lot) => acc + lot.totalSpots, 0);
    const occupiedSpots = lots.reduce((acc, lot) => acc + lot.occupiedSpots, 0);
    const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

    res.json({
      revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      activeSessions,
      totalLots,
      totalUsers,
      occupancyRate: Math.round(occupancyRate)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueTrends = async (req, res) => {
  try {
    // Get revenue for the last 24 hours, grouped by hour
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const trends = await ParkingSession.aggregate([
      { 
        $match: { 
          status: "completed",
          endTime: { $gte: oneDayAgo }
        } 
      },
      {
        $group: {
          _id: { $hour: "$endTime" },
          amount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format for frontend (ensuring all 24 hours are present if needed, 
    // but for now just returning what we have)
    const formattedTrends = trends.map(item => ({
      time: `${item._id.toString().padStart(2, '0')}:00`,
      amount: item.amount
    }));

    res.json(formattedTrends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const activities = await ParkingSession.find()
      .populate("user", "name email")
      .populate("parkingLot", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedActivities = activities.map(session => ({
      id: session._id,
      plate: session.user ? session.user.name : "Unknown", // Assuming name is used as plate for now or user has plate
      time: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: session.vehicleType.toUpperCase(),
      amount: session.totalAmount > 0 ? `NPR ${session.totalAmount}` : "NPR 0",
      status: session.status.toUpperCase(),
      parkingLot: session.parkingLot ? session.parkingLot.name : "Unknown"
    }));

    res.json(formattedActivities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CRUD for Parking Lots
exports.getAllLots = async (req, res) => {
  try {
    const lots = await ParkingLot.find().sort({ createdAt: -1 });
    res.json(lots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addParkingLot = async (req, res) => {
  try {
    const { name, lat, lon, pricePerHour, totalSpots, type } = req.body;
    const newLot = await ParkingLot.create({
      name,
      lat,
      lon,
      pricePerHour,
      totalSpots,
      type
    });
    res.status(201).json(newLot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteParkingLot = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await ParkingLot.findByIdAndDelete(id);
    if (!lot) {
      return res.status(404).json({ message: "Parking lot not found" });
    }
    res.json({ message: "Parking lot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateParkingLot = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLot = await ParkingLot.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedLot) {
      return res.status(404).json({ message: "Parking lot not found" });
    }
    res.json(updatedLot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
