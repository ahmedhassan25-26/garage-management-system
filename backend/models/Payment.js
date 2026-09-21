const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    method: {
      type: String,
      enum: [
        "cash",
        "bank",
        "mobile_money",
        "card",
      ],
      required: true,
    },

    reference: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Payment",
  paymentSchema
);