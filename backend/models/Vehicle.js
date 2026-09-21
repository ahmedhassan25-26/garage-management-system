const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    make: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    licensePlate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    vin: {
      type: String,
      trim: true,
      uppercase: true,
    },

    color: {
      type: String,
      trim: true,
    },

    mileage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);