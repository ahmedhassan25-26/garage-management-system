const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

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

    jobCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobCard",
      required: true,
      unique: true,
    },

    services: [
      {
        description: String,
        cost: {
          type: Number,
          default: 0,
        },
      },
    ],

    parts: [
      {
        part: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SparePart",
        },

        name: String,

        quantity: Number,

        unitPrice: Number,

        totalPrice: Number,
      },
    ],

    subtotal: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      default: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "partially_paid",
        "paid",
      ],
      default: "unpaid",
    },

    status: {
      type: String,
      enum: [
        "draft",
        "issued",
        "cancelled",
      ],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Invoice",
  invoiceSchema
);