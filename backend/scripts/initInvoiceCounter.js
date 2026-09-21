require("dotenv").config();
const connectDB = require("../config/db");
const Invoice = require("../models/Invoice");
const Counter = require("../models/Counter");

const run = async () => {
  try {
    await connectDB();

    const invoices = await Invoice.find({}, "invoiceNumber");

    let max = 0;

    invoices.forEach((inv) => {
      if (!inv || !inv.invoiceNumber) return;
      const m = inv.invoiceNumber.match(/INV-(\d+)/);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });

    // Set counter to max so next will be max+1
    await Counter.findOneAndUpdate(
      { _id: "invoiceNumber" },
      { $set: { seq: max } },
      { upsert: true }
    );

    console.log(`Initialized invoice counter to ${max} (next: ${max + 1})`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to initialize invoice counter:", err);
    process.exit(1);
  }
};

run();
