const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  user,
  action,
  module,
  description,
  recordId = null,
  ipAddress = null,
  session = null,
  metadata = null,
}) => {
  try {
    const auditData = {
      user,
      action,
      module,
      description,
      recordId,
      ipAddress,
      metadata,
    };

    if (session) {
      await AuditLog.create([auditData], { session });
      return;
    }

    await AuditLog.create(auditData);
  } catch (error) {
    if (session) throw error;

    console.error(
      "Audit log error:",
      error.message
    );
  }
};

module.exports = createAuditLog;