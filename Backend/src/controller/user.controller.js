const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage configuration (in-memory storage for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// const pid = new mongoose.Types.ObjectId(productId);

const signupSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    "string.base": "Username must be a text value",
    // "string.alphanum": "Username must only contain letters and numbers",
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot be more than 30 characters",
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Enter a valid email address",
      "string.empty": "Email is required",
    }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.empty": "Password is required",
  }),

  role: Joi.string().valid("driver", "superadmin").default("driver").messages({
    "any.only": "Role must be either 'user' or 'admin'",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Enter a valid email address",
      "string.empty": "Email is required",
    }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

const login = async (req, res) => {
  try {
    const logindata = req.body;

    console.log("Login attempt with email:", logindata.email); // Debug log

    const { error, value } = loginSchema.validate(logindata);

    if (error) {
      console.log("Validation error:", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Find user
    const user = await User.findOne({ email: value.email });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials", // Don't reveal which field is wrong
      });
    }

    // Check password
    const correctPass = await bcrypt.compare(value.password, user.password);
    console.log("Password correct:", correctPass);

    if (!correctPass) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Create token payload
    const tokenPayload = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      
    };

    // Generate token with expiration
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }, // Token expires in 7 days
    );

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

const signup = async (req, res) => {
  try {
    const data = req.body;

    const { error, value } = signupSchema.validate(data, {
      allowUnknown: true,
      abortEarly: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const saltrounds = 10;
    const hash = bcrypt.hashSync(value.password, saltrounds);

    // Create user
    const user = await User.create({ ...value, password: hash });

    // Create token payload (without password)
    const userObject = user.toObject();
    delete userObject.password;

    // Generate token
    const token = jwt.sign(userObject, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({
      success: false,
      message: "Error creating account",
      error: err.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    let photoUrl = req.body.photo; // Default to existing photo if not updated

    if (req.file) {
      // Upload new photo to Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "profile_photos",
          width: 150,
          height: 150,
          crop: "fill",
        }
      );
      photoUrl = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username, email, photo: photoUrl },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to send emails
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "BugSlayer <noreply@bugslayer.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Get user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "There is no user with that email address.",
      });
    }

    // 2. Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 3. Save the token to the user document (hashed) and set expiration
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // 4. Send email with reset link
    const resetURL = `${req.protocol}://${req.get("host")}/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 min)",
        message,
      });

      res.status(200).json({
        success: true,
        message: "Token sent to email!",
      });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("Email sending error:", emailError);
      return res.status(500).json({
        success: false,
        message:
          "There was an error sending the email. Try again later!",
      });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  upload,
};
