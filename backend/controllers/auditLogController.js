const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate(
        "user",
        "name email role"
      )
      .sort({
        createdAt: -1,
      })
      .limit(100);

    res.status(200).json({
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getAuditLogs,
};