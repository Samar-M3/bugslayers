const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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


module.exports = {
  signup,
  login,
};
