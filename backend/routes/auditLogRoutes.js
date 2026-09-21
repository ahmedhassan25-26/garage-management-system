const express = require("express");

const {
  getAuditLogs,
} = require("../controllers/auditLogController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizePermission("audit.view"),
  getAuditLogs
);

module.exports = router;