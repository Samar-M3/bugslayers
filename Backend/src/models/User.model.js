const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
/**
 * User Model
 * Defines the schema for application users, including drivers and admins.
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
    enum: ["driver", "guard", "superadmin"], // Restricts roles to valid system types
    default: "driver",
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
