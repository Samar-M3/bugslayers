const express = require("express");
const {
  getAllParkingLots,
  getActiveSession,
  startSession,
  bookParking,
  getUserBookings,
  completeSession,
  guardEntry,
  guardExit,
} = require("../controller/parking.controller");
const { isauthenticated, Isadmin } = require("../middleware/auth");

const router = express.Router();

router.get("/lots", getAllParkingLots);
router.get("/active-session", isauthenticated, getActiveSession);
router.post("/start-session", isauthenticated, startSession);
router.post("/book", isauthenticated, bookParking);
router.get("/bookings", isauthenticated, getUserBookings);
router.post("/complete-session", isauthenticated, completeSession);

// Guard routes
router.post("/guard/entry", isauthenticated, Isadmin, guardEntry);
router.post("/guard/exit", isauthenticated, Isadmin, guardExit);

module.exports = router;
