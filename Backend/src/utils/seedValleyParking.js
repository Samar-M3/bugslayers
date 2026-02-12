const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const ParkingLot = require("../models/ParkingLot.model");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const fetchValleyParkingData = async () => {
  console.log(
    "OSM API is slow, using curated list for Kathmandu, Lalitpur, and Bhaktapur...",
  );

  const curatedLots = [
    // Kathmandu
    { name: "Civil Mall Parking", lat: 27.7008, lon: 85.3121 },
    { name: "Dharahara Parking Plaza", lat: 27.7005, lon: 85.312 },
    { name: "Basantapur Multi-level Parking", lat: 27.7031, lon: 85.3117 },
    { name: "Durbar Marg Parking Zone", lat: 27.7112, lon: 85.3168 },
    { name: "Bhatbhateni Naxal Parking", lat: 27.7155, lon: 85.3301 },
    { name: "City Center Parking", lat: 27.7088, lon: 85.3275 },
    { name: "Pashupati Area Parking", lat: 27.7104, lon: 85.3486 },
    { name: "TU Teaching Hospital Parking", lat: 27.7302, lon: 85.3305 },

    // Lalitpur
    { name: "Labim Mall Parking", lat: 27.6771, lon: 85.3171 },
    { name: "Patan Durbar Square Parking", lat: 27.6735, lon: 85.3252 },
    { name: "Salesberry Jawalakhel Parking", lat: 27.6728, lon: 85.3118 },
    { name: "Jhamsikhel Parking Area", lat: 27.6795, lon: 85.3055 },
    { name: "Pulchowk Engineering Campus Parking", lat: 27.6815, lon: 85.3185 },

    // Bhaktapur
    {
      name: "Bhaktapur Durbar Square Entrance Parking",
      lat: 27.6715,
      lon: 85.4285,
    },
    { name: "Siddhapokhari Parking Zone", lat: 27.6738, lon: 85.4205 },
    { name: "Chyasingmandap Parking", lat: 27.6722, lon: 85.4325 },
    { name: "Jagati Parking Point", lat: 27.6625, lon: 85.4415 },
  ];

  return curatedLots.map((lot) => ({
    ...lot,
    pricePerHour: Math.floor(Math.random() * 30) + 20,
    totalSpots: Math.floor(Math.random() * 80) + 20,
    occupiedSpots: Math.floor(Math.random() * 10),
    type: "both",
    status: "available",
  }));
};

const seedValleyData = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/hackathon";
    await mongoose.connect(mongoUri);
    console.log("Database connected.");

    const parkingLots = await fetchValleyParkingData();

    if (parkingLots.length > 0) {
      console.log(
        `Clearing existing parking lots and inserting ${parkingLots.length} new ones...`,
      );
      await ParkingLot.deleteMany({});

      await ParkingLot.insertMany(parkingLots);
      console.log("Valley parking data seeding completed!");
    } else {
      console.log("No data found to seed.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error in seedValleyData:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedValleyData();
}
