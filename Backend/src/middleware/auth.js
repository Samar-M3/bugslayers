const jwt = require("jsonwebtoken");
const User=require("../models/User.model")

const isauthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('Auth Header:', authHeader); // Debug log
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    console.log('Token:', token.substring(0, 30) + '...'); // Debug log
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Decoded token:', decoded); // See what's in the token
    
    // Your token has _id, not id
    const userId = decoded._id || decoded.id;
    
    console.log('Looking for user with ID:', userId); // Debug log
    
    const foundUser = await User.findById(userId);
    
    if (!foundUser) {
      console.log('User not found in database'); // Debug log
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    console.log('User found:', foundUser.username); // Debug log
    
    req.user = foundUser;
    req.userId = foundUser._id;
    next();
    
  } catch (err) {
    console.error('Auth Error:', err.message); // See the actual error!
    
    // Give more specific error messages
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: "Authentication failed",
      error: err.message 
    });
  }
};

const Isadmin=(req,res,next)=>{
    const user=req.user
    if(user.role==="superadmin"){
        next()
    }else{
        res.status(403).send({message:"forbidden"})
    }
}

const Isbuyer=(req,res,next)=>{
     const user=req.user
    if(user.role==="buyer"){
        next()
    }else{
        res.status(403).send({message:"forbidden"})
    }
}

const IsSeller=(req,res,next)=>{
     const user=req.user
    if(user.role==="seller"){
        next()
    }else{
        res.status(403).send({message:"forbidden"})
    }
}

module.exports = {
  isauthenticated,
  Isadmin,
  Isbuyer,
  IsSeller
};
