const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ParkingLot = require("./src/models/ParkingLot.model");

dotenv.config();

const popularParkingLots = [
  {
    name: "Kathmandu Mall Parking",
    lat: 27.7027,
    lon: 85.3121,
    pricePerHour: 50,
    totalSpots: 100,
    occupiedSpots: 20,
    type: "car",
    status: "available"
  },
  {
    name: "Civil Mall Parking",
    lat: 27.7006,
    lon: 85.3121,
    pricePerHour: 60,
    totalSpots: 150,
    occupiedSpots: 45,
    type: "car",
    status: "available"
  },
  {
    name: "Labim Mall Parking",
    lat: 27.6775,
    lon: 85.3171,
    pricePerHour: 80,
    totalSpots: 200,
    occupiedSpots: 120,
    type: "both",
    status: "available"
  },
  {
    name: "Bhat-Bhateni Naxal Parking",
    lat: 27.7126,
    lon: 85.3297,
    pricePerHour: 40,
    totalSpots: 80,
    occupiedSpots: 10,
    type: "both",
    status: "available"
  },
  {
    name: "City Center Parking",
    lat: 27.7091,
    lon: 85.3259,
    pricePerHour: 50,
    totalSpots: 120,
    occupiedSpots: 30,
    type: "car",
    status: "available"
  },
  {
    name: "Tribhuvan International Airport Parking",
    lat: 27.6974,
    lon: 85.3592,
    pricePerHour: 100,
    totalSpots: 500,
    occupiedSpots: 350,
    type: "both",
    status: "available"
  },
  {
    name: "Lakeside Parking Pokhara",
    lat: 28.2095,
    lon: 83.9589,
    pricePerHour: 40,
    totalSpots: 60,
    occupiedSpots: 15,
    type: "bike",
    status: "available"
  },
  {
    name: "Thamel Public Parking",
    lat: 27.7149,
    lon: 85.3148,
    pricePerHour: 60,
    totalSpots: 50,
    occupiedSpots: 40,
    type: "both",
    status: "available"
  },
  {
    name: "Patan Durbar Square Parking",
    lat: 27.6737,
    lon: 85.3252,
    pricePerHour: 30,
    totalSpots: 40,
    occupiedSpots: 5,
    type: "bike",
    status: "available"
  },
  {
    name: "Dharahara Parking",
    lat: 27.7005,
    lon: 85.3120,
    pricePerHour: 50,
    totalSpots: 120,
    occupiedSpots: 60,
    type: "both",
    status: "available"
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected for seeding...");

    // Optional: Clear existing data if you want a clean slate
    // await ParkingLot.deleteMany({});
    // console.log("Existing parking lots cleared.");

    for (const lot of popularParkingLots) {
      // Check if it already exists by name to avoid duplicates
      const exists = await ParkingLot.findOne({ name: lot.name });
      if (!exists) {
        await ParkingLot.create(lot);
        console.log(`Added: ${lot.name}`);
      } else {
        console.log(`Skipped (already exists): ${lot.name}`);
      }
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
