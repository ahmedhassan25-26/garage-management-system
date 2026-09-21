const mongoose = require("mongoose");

const sparePartSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    partNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    minimumStock: {
      type: Number,
      default: 5,
      min: 0,
    },

    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    supplier: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SparePart", sparePartSchema);