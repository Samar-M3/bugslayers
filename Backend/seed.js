const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User.model");
const ParkingLot = require("./src/models/ParkingLot.model");
const ParkingSession = require("./src/models/ParkingSession.model");
const SystemConfig = require("./src/models/SystemConfig.model");

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data (except superadmins)
    await User.deleteMany({ role: { $ne: "superadmin" } });
    await ParkingLot.deleteMany({});
    await ParkingSession.deleteMany({});
    await SystemConfig.deleteMany({});

    console.log("Existing data cleared.");

    // 1. Create System Config
    await SystemConfig.create({
      currency: "NPR",
      gracePeriod: 15,
      taxRate: 13,
      language: "English",
      twoFactorAuth: false
    });

    // 2. Create Fake Users (Drivers)
    const users = await User.insertMany([
      { username: "ram_sharma", email: "ram@example.com", password: "password123", role: "driver", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ram" },
      { username: "sita_thapa", email: "sita@example.com", password: "password123", role: "driver", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sita" },
      { username: "hari_kumar", email: "hari@example.com", password: "password123", role: "driver", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hari" },
      { username: "rita_rai", email: "rita@example.com", password: "password123", role: "driver", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rita" },
      { username: "nabin_magar", email: "nabin@example.com", password: "password123", role: "driver", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nabin" }
    ]);
    console.log(`${users.length} users created.`);

    // 3. Create Fake Parking Lots
    const lots = await ParkingLot.insertMany([
      { name: "Civil Mall Parking", lat: 27.7008, lon: 85.3115, pricePerHour: 50, totalSpots: 100, occupiedSpots: 45, status: "available", type: "both" },
      { name: "Durbarmarg Premium Lot", lat: 27.7101, lon: 85.3164, pricePerHour: 100, totalSpots: 50, occupiedSpots: 50, status: "full", type: "car" },
      { name: "Labim Mall Underground", lat: 27.6771, lon: 85.3168, pricePerHour: 60, totalSpots: 150, occupiedSpots: 80, status: "available", type: "both" },
      { name: "Thamel Bike Station", lat: 27.7145, lon: 85.3101, pricePerHour: 20, totalSpots: 200, occupiedSpots: 120, status: "available", type: "bike" },
      { name: "New Road Multi-Level", lat: 27.7035, lon: 85.3120, pricePerHour: 40, totalSpots: 80, occupiedSpots: 10, status: "available", type: "car" }
    ]);
    console.log(`${lots.length} parking lots created.`);

    // 4. Create Fake Parking Sessions
    const sessions = [];
    const now = new Date();

    // Active Sessions (Currently Parked)
    for (let i = 0; i < 5; i++) {
      sessions.push({
        user: users[i % users.length]._id,
        parkingLot: lots[i % lots.length]._id,
        startTime: new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000), // Started 0-2 hours ago
        status: "active",
        vehicleType: lots[i % lots.length].type === "both" ? "car" : lots[i % lots.length].type,
        totalAmount: 0
      });
    }

    // Completed Sessions (For Revenue Trends - Last 24 Hours)
    for (let i = 0; i < 20; i++) {
      const endTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Ended sometime in last 24h
      const startTime = new Date(endTime.getTime() - (Math.random() * 3 + 1) * 60 * 60 * 1000); // Parked for 1-4 hours
      const hours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
      const lot = lots[i % lots.length];
      
      sessions.push({
        user: users[i % users.length]._id,
        parkingLot: lot._id,
        startTime,
        endTime,
        status: "completed",
        vehicleType: lot.type === "both" ? "car" : lot.type,
        totalAmount: hours * lot.pricePerHour
      });
    }

    await ParkingSession.insertMany(sessions);
    console.log(`${sessions.length} sessions created.`);

    console.log("Database seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedData();
