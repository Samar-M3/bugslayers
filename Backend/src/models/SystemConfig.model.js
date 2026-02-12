const mongoose = require("mongoose");

const SystemConfigSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: "NPR",
    },
    gracePeriod: {
      type: Number,
      default: 15,
    },
    taxRate: {
      type: Number,
      default: 13,
    },
    language: {
      type: String,
      default: "English",
    },
    twoFactorAuth: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemConfig", SystemConfigSchema);
