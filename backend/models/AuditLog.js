const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    module: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    // Optional structured context (e.g. old/new quantities for stock events)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AuditLog",
  auditLogSchema
);