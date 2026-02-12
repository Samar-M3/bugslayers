const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
/**
 * User Model
 * Defines the schema for application users, including users and admins.
 */
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    default: "User",
  },
  lastName: {
    type: String,
    required: true,
    default: "Name",
  },
  username: {
    type: String,
    required: true,
    unique: true, // Ensures usernames are not duplicated
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures emails are not duplicated
  },
  password: {
    type: String,
    required: true, // Hashed password stored in DB
  },
  role: {
    type: String,
    enum: ["user", "driver", "guard", "superadmin"], // Includes legacy 'driver' for compatibility
    default: "user",
  },
  photo: {
    type: String, // Cloudinary URL or local path for profile picture
    default: "",
  },
  // Security fields for password recovery
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

const User = mongoose.model("User", userSchema);
module.exports = User;
