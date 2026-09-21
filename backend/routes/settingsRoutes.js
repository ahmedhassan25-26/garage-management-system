const express = require("express");
const { getSettings } = require("../controllers/settingsController");
const { protect } = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

router.get("/company", protect, authorizePermission("settings.view"), getSettings);

module.exports = router;
