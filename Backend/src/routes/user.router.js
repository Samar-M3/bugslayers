const express = require("express");
const {
  login,
  signup,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  getNotifications,
  markAllNotificationsRead,
  upload,
} = require("../controller/user.controller");
const { isauthenticated, Isadmin } = require("../middleware/auth");
const User = require("../models/User.model");

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/profile", isauthenticated, getProfile);
router.get("/notifications", isauthenticated, getNotifications);
router.patch("/notifications/read-all", isauthenticated, markAllNotificationsRead);

router.patch("/profile", isauthenticated, upload.single("photo"), updateProfile);

router
  .route("/:id")
  .get(async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  })
  .patch(isauthenticated, async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  })
  .delete(isauthenticated, async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/dashboard", isauthenticated, Isadmin, (req, res) => {
  res.json({ secretData: "admin only" });
});

router.post("/login", login);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);

module.exports = router;
