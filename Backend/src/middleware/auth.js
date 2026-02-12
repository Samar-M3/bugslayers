const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

/**
 * Authentication Middleware
 * Verifies the JWT token from the Authorization header and attaches the user to the request object.
 */
const isauthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Bearer token is provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both '_id' (standard Mongo) and 'id' in token payload
    const userId = decoded._id || decoded.id;

    const foundUser = await User.findById(userId);

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user information to the request for subsequent middleware/routes
    req.user = foundUser;
    req.userId = foundUser._id;
    next();
  } catch (err) {
    console.error("Auth Error:", err.message);

    // Handle specific JWT error cases
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: err.message,
    });
  }
};

/**
 * Authorization Middleware: Super Admin
 * Restricts access to superadmin users only.
 */
const Isadmin = (req, res, next) => {
  const user = req.user;
  if (user.role === "superadmin") {
    next();
  } else {
    res.status(403).send({ message: "Forbidden: Admin access required" });
  }
};

/**
 * Authorization Middleware: Guard
 */
const IsGuard = (req, res, next) => {
  const user = req.user;
  if (user.role === "guard") {
    next();
  } else {
    res.status(403).send({ message: "Forbidden: Guard access required" });
  }
};

/**
 * Authorization Middleware: Guard or Super Admin
 */
const IsGuardOrAdmin = (req, res, next) => {
  const user = req.user;
  if (user.role === "guard" || user.role === "superadmin") {
    next();
  } else {
    res.status(403).send({ message: "Forbidden: Guard or Admin access required" });
  }
};

module.exports = {
  isauthenticated,
  Isadmin,
  IsGuard,
  IsGuardOrAdmin,
};
