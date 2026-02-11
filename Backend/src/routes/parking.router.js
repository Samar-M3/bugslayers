const express = require("express");
const { getAllParkingLots, getActiveSession, startSession } = require("../controller/parking.controller");
const { isauthenticated } = require("../middleware/auth");

const router = express.Router();

router.get("/lots", getAllParkingLots);
router.get("/active-session", isauthenticated, getActiveSession);
router.post("/start-session", isauthenticated, startSession);

module.exports = router;
