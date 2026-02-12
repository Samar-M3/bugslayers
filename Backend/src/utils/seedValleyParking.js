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
    {
      name: "Civil Mall Parking",
      lat: 27.7008,
      lon: 85.3121,
      pricePerHour: 50,
      totalSpots: 120,
      occupiedSpots: 54,
      type: "both",
    },
    {
      name: "Dharahara Parking Plaza",
      lat: 27.7005,
      lon: 85.312,
      pricePerHour: 45,
      totalSpots: 90,
      occupiedSpots: 38,
      type: "both",
    },
    {
      name: "Basantapur Multi-level Parking",
      lat: 27.7031,
      lon: 85.3117,
      pricePerHour: 40,
      totalSpots: 160,
      occupiedSpots: 70,
      type: "both",
    },
    {
      name: "Durbar Marg Parking Zone",
      lat: 27.7112,
      lon: 85.3168,
      pricePerHour: 80,
      totalSpots: 130,
      occupiedSpots: 94,
      type: "car",
    },
    {
      name: "Bhatbhateni Naxal Parking",
      lat: 27.7155,
      lon: 85.3301,
      pricePerHour: 30,
      totalSpots: 75,
      occupiedSpots: 28,
      type: "both",
    },
    {
      name: "City Center Parking (Kamaladi)",
      lat: 27.7092,
      lon: 85.3233,
      pricePerHour: 55,
      totalSpots: 100,
      occupiedSpots: 61,
      type: "both",
    },
    {
      name: "Pashupati Area Parking",
      lat: 27.7104,
      lon: 85.3486,
      pricePerHour: 35,
      totalSpots: 110,
      occupiedSpots: 37,
      type: "both",
    },
    {
      name: "TU Teaching Hospital Parking",
      lat: 27.7302,
      lon: 85.3305,
      pricePerHour: 25,
      totalSpots: 140,
      occupiedSpots: 46,
      type: "both",
    },
    {
      name: "Sundhara Parking Area",
      lat: 27.7019,
      lon: 85.3136,
      pricePerHour: 40,
      totalSpots: 95,
      occupiedSpots: 42,
      type: "both",
    },
    {
      name: "Narayanhiti North Gate Parking",
      lat: 27.7139,
      lon: 85.3217,
      pricePerHour: 45,
      totalSpots: 65,
      occupiedSpots: 23,
      type: "car",
    },
    {
      name: "Thamel Chhaya Center Parking",
      lat: 27.7175,
      lon: 85.3115,
      pricePerHour: 60,
      totalSpots: 150,
      occupiedSpots: 78,
      type: "both",
    },
    {
      name: "Kalanki Parking Hub",
      lat: 27.6936,
      lon: 85.2814,
      pricePerHour: 35,
      totalSpots: 85,
      occupiedSpots: 31,
      type: "both",
    },
    {
      name: "New Baneshwor Parking Complex",
      lat: 27.6915,
      lon: 85.342,
      pricePerHour: 45,
      totalSpots: 125,
      occupiedSpots: 56,
      type: "both",
    },
    {
      name: "Koteshwor Ringroad Parking",
      lat: 27.6796,
      lon: 85.3498,
      pricePerHour: 35,
      totalSpots: 110,
      occupiedSpots: 49,
      type: "both",
    },
    {
      name: "Balaju Bypass Parking Area",
      lat: 27.7342,
      lon: 85.3001,
      pricePerHour: 30,
      totalSpots: 90,
      occupiedSpots: 34,
      type: "both",
    },
    {
      name: "Maharajgunj Parking Point",
      lat: 27.7387,
      lon: 85.3317,
      pricePerHour: 40,
      totalSpots: 80,
      occupiedSpots: 29,
      type: "both",
    },
    {
      name: "Kapan Budhanilkantha Parking",
      lat: 27.7422,
      lon: 85.3629,
      pricePerHour: 25,
      totalSpots: 70,
      occupiedSpots: 21,
      type: "both",
    },

    // Lalitpur
    {
      name: "Labim Mall Parking",
      lat: 27.6771,
      lon: 85.3171,
      pricePerHour: 60,
      totalSpots: 180,
      occupiedSpots: 73,
      type: "both",
    },
    {
      name: "Patan Durbar Square Parking",
      lat: 27.6735,
      lon: 85.3252,
      pricePerHour: 35,
      totalSpots: 70,
      occupiedSpots: 27,
      type: "both",
    },
    {
      name: "Jawalakhel Parking Zone",
      lat: 27.6728,
      lon: 85.3118,
      pricePerHour: 40,
      totalSpots: 95,
      occupiedSpots: 34,
      type: "both",
    },
    {
      name: "Jhamsikhel Parking Area",
      lat: 27.6795,
      lon: 85.3055,
      pricePerHour: 45,
      totalSpots: 80,
      occupiedSpots: 26,
      type: "both",
    },
    {
      name: "Pulchowk Engineering Campus Parking",
      lat: 27.6815,
      lon: 85.3185,
      pricePerHour: 20,
      totalSpots: 100,
      occupiedSpots: 39,
      type: "both",
    },
    {
      name: "Ekantakuna Parking Point",
      lat: 27.6655,
      lon: 85.3036,
      pricePerHour: 30,
      totalSpots: 90,
      occupiedSpots: 29,
      type: "both",
    },
    {
      name: "Kumaripati Central Parking",
      lat: 27.6717,
      lon: 85.3156,
      pricePerHour: 35,
      totalSpots: 85,
      occupiedSpots: 30,
      type: "both",
    },
    {
      name: "Lagankhel Bus Park Parking",
      lat: 27.6668,
      lon: 85.3216,
      pricePerHour: 25,
      totalSpots: 120,
      occupiedSpots: 52,
      type: "both",
    },
    {
      name: "Satdobato Ringroad Parking",
      lat: 27.6572,
      lon: 85.3249,
      pricePerHour: 30,
      totalSpots: 110,
      occupiedSpots: 47,
      type: "both",
    },
    {
      name: "Imadol Parking Area",
      lat: 27.6552,
      lon: 85.3374,
      pricePerHour: 25,
      totalSpots: 75,
      occupiedSpots: 22,
      type: "both",
    },
    {
      name: "Gwarko Junction Parking",
      lat: 27.6678,
      lon: 85.3319,
      pricePerHour: 30,
      totalSpots: 105,
      occupiedSpots: 43,
      type: "both",
    },
    {
      name: "Kupondole Bridge Parking",
      lat: 27.6842,
      lon: 85.3189,
      pricePerHour: 40,
      totalSpots: 85,
      occupiedSpots: 32,
      type: "both",
    },
    {
      name: "Mahalaxmisthan Parking Lot",
      lat: 27.6674,
      lon: 85.3186,
      pricePerHour: 30,
      totalSpots: 80,
      occupiedSpots: 26,
      type: "both",
    },
    {
      name: "Bhaisepati Parking Zone",
      lat: 27.6489,
      lon: 85.3078,
      pricePerHour: 25,
      totalSpots: 95,
      occupiedSpots: 30,
      type: "both",
    },
    {
      name: "Chakupat Riverside Parking",
      lat: 27.6749,
      lon: 85.3148,
      pricePerHour: 35,
      totalSpots: 68,
      occupiedSpots: 19,
      type: "both",
    },

    // Bhaktapur
    {
      name: "Bhaktapur Durbar Square Entrance Parking",
      lat: 27.6715,
      lon: 85.4285,
      pricePerHour: 30,
      totalSpots: 95,
      occupiedSpots: 40,
      type: "both",
    },
    {
      name: "Siddhapokhari Parking Zone",
      lat: 27.6738,
      lon: 85.4205,
      pricePerHour: 25,
      totalSpots: 70,
      occupiedSpots: 24,
      type: "both",
    },
    {
      name: "Chyasingmandap Parking",
      lat: 27.6722,
      lon: 85.4325,
      pricePerHour: 25,
      totalSpots: 65,
      occupiedSpots: 19,
      type: "both",
    },
    {
      name: "Jagati Parking Point",
      lat: 27.6625,
      lon: 85.4415,
      pricePerHour: 35,
      totalSpots: 90,
      occupiedSpots: 33,
      type: "both",
    },
    {
      name: "Kamalbinayak Parking Area",
      lat: 27.6727,
      lon: 85.4387,
      pricePerHour: 30,
      totalSpots: 80,
      occupiedSpots: 28,
      type: "both",
    },
    {
      name: "Suryabinayak Temple Parking",
      lat: 27.6597,
      lon: 85.4419,
      pricePerHour: 30,
      totalSpots: 100,
      occupiedSpots: 36,
      type: "both",
    },
    {
      name: "Thimi Balkumari Parking",
      lat: 27.6781,
      lon: 85.3803,
      pricePerHour: 25,
      totalSpots: 85,
      occupiedSpots: 31,
      type: "both",
    },
    {
      name: "Madhyapur Thimi Municipality Parking",
      lat: 27.6838,
      lon: 85.3881,
      pricePerHour: 20,
      totalSpots: 70,
      occupiedSpots: 21,
      type: "both",
    },
    {
      name: "Radhe Radhe Junction Parking",
      lat: 27.6721,
      lon: 85.4048,
      pricePerHour: 20,
      totalSpots: 90,
      occupiedSpots: 35,
      type: "both",
    },
    {
      name: "Sallaghari Sports Ground Parking",
      lat: 27.6799,
      lon: 85.4172,
      pricePerHour: 25,
      totalSpots: 120,
      occupiedSpots: 44,
      type: "both",
    },
    {
      name: "Dudhpati Bhaktapur Parking",
      lat: 27.6757,
      lon: 85.4311,
      pricePerHour: 25,
      totalSpots: 88,
      occupiedSpots: 32,
      type: "both",
    },
    {
      name: "Taumadhi Square Parking",
      lat: 27.6729,
      lon: 85.4297,
      pricePerHour: 30,
      totalSpots: 72,
      occupiedSpots: 24,
      type: "both",
    },
    {
      name: "Byasi Parking Area",
      lat: 27.6711,
      lon: 85.4338,
      pricePerHour: 20,
      totalSpots: 64,
      occupiedSpots: 18,
      type: "both",
    },
    {
      name: "Nalinchowk Highway Parking",
      lat: 27.6691,
      lon: 85.4554,
      pricePerHour: 25,
      totalSpots: 95,
      occupiedSpots: 37,
      type: "both",
    },
    {
      name: "Changunarayan Entry Parking",
      lat: 27.7196,
      lon: 85.4296,
      pricePerHour: 20,
      totalSpots: 70,
      occupiedSpots: 22,
      type: "both",
    },
  ];

  return curatedLots.map((lot) => {
    const status = lot.occupiedSpots >= lot.totalSpots ? "full" : "available";
    return {
      ...lot,
      status,
    };
  });
};

const seedValleyData = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/hackathon";
    await mongoose.connect(mongoUri);
    console.log("Database connected.");

    const parkingLots = await fetchValleyParkingData();

    if (parkingLots.length > 0) {
      console.log(`Upserting ${parkingLots.length} curated valley parking lots...`);
      const operations = parkingLots.map((lot) => ({
        updateOne: {
          filter: { name: lot.name },
          update: { $set: lot },
          upsert: true,
        },
      }));
      const result = await ParkingLot.bulkWrite(operations);
      console.log(
        `Valley parking data seeding completed! Upserted/modified: ${result.upsertedCount + result.modifiedCount}`,
      );
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
