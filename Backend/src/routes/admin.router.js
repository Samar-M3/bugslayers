const express = require("express");
const {
  getDashboardStats,
  getRevenueTrends,
  getRecentActivity,
  getAllLots,
  addParkingLot,
  deleteParkingLot,
  updateParkingLot,
  aiDetectParking,
} = require("../controller/admin.controller");
const { isauthenticated, Isadmin } = require("../middleware/auth");

const router = express.Router();

// All admin routes should be protected
router.use(isauthenticated);
// router.use(Isadmin);

router.get("/stats", getDashboardStats);
router.get("/revenue-trends", getRevenueTrends);
router.get("/recent-activity", getRecentActivity);

// Parking Lot CRUD
router.get("/lots", getAllLots);
router.post("/lots", addParkingLot);
router.delete("/lots/:id", deleteParkingLot);
router.put("/lots/:id", updateParkingLot);
router.post("/ai-detect", aiDetectParking);

module.exports = router;
