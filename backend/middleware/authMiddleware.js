const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "_id role isActive"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Not authorized. User account is inactive or unavailable.",
      });
    }

    req.user = {
      ...decoded,
      userId: String(user._id),
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized. Invalid or expired token.",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. You do not have permission.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};