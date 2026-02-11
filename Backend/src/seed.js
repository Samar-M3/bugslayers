const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const ParkingLot = require("./models/ParkingLot.model");

dotenv.config({ path: path.join(__dirname, "../.env") });

const sampleParkingLots = [
  {
    name: "Civil Mall Parking",
    lat: 27.7008,
    lon: 85.3121,
    pricePerHour: 50,
    totalSpots: 100,
    occupiedSpots: 45,
    type: "both",
    status: "available"
  },
  {
    name: "Dharahara Parking",
    lat: 27.7005,
    lon: 85.3120,
    pricePerHour: 40,
    totalSpots: 80,
    occupiedSpots: 80,
    type: "both",
    status: "full"
  },
  {
    name: "Labim Mall Parking",
    lat: 27.6771,
    lon: 85.3171,
    pricePerHour: 60,
    totalSpots: 150,
    occupiedSpots: 65,
    type: "both",
    status: "available"
  },
  {
    name: "Basantapur Plaza Parking",
    lat: 27.7042,
    lon: 85.3065,
    pricePerHour: 30,
    totalSpots: 50,
    occupiedSpots: 12,
    type: "both",
    status: "available"
  },
  {
    name: "Durbar Marg Parking Zone",
    lat: 27.7112,
    lon: 85.3168,
    pricePerHour: 80,
    totalSpots: 120,
    occupiedSpots: 95,
    type: "car",
    status: "available"
  },
  {
    name: "New Road Multi-level Parking",
    lat: 27.7031,
    lon: 85.3117,
    pricePerHour: 40,
    totalSpots: 200,
    occupiedSpots: 180,
    type: "both",
    status: "available"
  },
  {
    name: "Bhatbhateni Naxal Parking",
    lat: 27.7155,
    lon: 85.3301,
    pricePerHour: 20,
    totalSpots: 60,
    occupiedSpots: 15,
    type: "both",
    status: "available"
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected for seeding...");

    // Clear existing data
    await ParkingLot.deleteMany({});
    console.log("Existing parking lots cleared.");

    // Insert sample data
    await ParkingLot.insertMany(sampleParkingLots);
    console.log("Sample parking lots seeded successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
