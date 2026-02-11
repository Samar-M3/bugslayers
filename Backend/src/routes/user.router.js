const express = require("express");
const {
  login,
  signup,
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

// router.get("/profile", isauthenticated, async (req, res) => {
//   const user = await User.findById(req.user.id).select("-password");
//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }
//   res.json(user);
// });

// router.patch("/profile", isauthenticated, async (req, res) => {
//   if (req.user.id !== req.params.id && req.user.role !== "superadmin") {
//     return res.status(403).json({ message: "Access denied" });
//   }
//   const user = await User.findByIdAndUpdate(req.user.id, req.body, {
//     new: true,
//   }).select("-password");

//   res.json(user);
// });

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

module.exports = router;
