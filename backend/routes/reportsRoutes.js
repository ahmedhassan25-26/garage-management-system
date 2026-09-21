const express = require("express");
const router = express.Router();
const { getReports, exportReports } = require("../controllers/reportsController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

router.get("/", protect, authorizePermission("reports.view"), getReports);
router.get("/export", protect, authorizePermission("reports.view"), exportReports);

module.exports = router;
