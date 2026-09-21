const mongoose = require("mongoose");

const jobCardSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    assignedMechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    complaint: {
      type: String,
      required: true,
      trim: true,
    },

    diagnosis: {
      type: String,
      trim: true,
    },

    services: [
      {
        description: {
          type: String,
          trim: true,
        },
        cost: {
          type: Number,
          default: 0,
        },
      },
    ],

        partsUsed: [
      {
        part: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SparePart",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },

        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    estimatedCost: {
      type: Number,
      default: 0,
    },

    actualCost: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
    },

    completionDate: {
      type: Date,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    stockRestored: {
      type: Boolean,
      default: false,
    },

    readyForInvoicing: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JobCard", jobCardSchema);