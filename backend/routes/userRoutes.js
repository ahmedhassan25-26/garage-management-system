const express = require("express");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const {
  getMechanics,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

// Current user's profile
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "You can access your profile",
    user: req.user,
  });
});

// Admin-only test
router.get(
  "/admin",
  protect,
  authorizePermission("users.manage"),
  (req, res) => {
    res.json({
      message: "Welcome Admin. You have admin access.",
    });
  }
);

// Get all users (admin only)
router.get(
  "/",
  protect,
  authorizePermission("users.manage"),
  getUsers
);

// Get mechanics
router.get(
  "/mechanics",
  protect,
  authorize("admin", "manager"),
  getMechanics
);

// Create user
router.post(
  "/",
  protect,
  authorizePermission("users.manage"),
  createUser
);

// Update user
router.put(
  "/:id",
  protect,
  authorizePermission("users.manage"),
  updateUser
);

// Delete user
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteUser
);

module.exports = router;