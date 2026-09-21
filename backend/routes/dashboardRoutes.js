const express = require("express");

const {
  getDashboardStats,
} = require("../controllers/dashboardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizePermission("dashboard.view"),
  getDashboardStats
);

module.exports = router;