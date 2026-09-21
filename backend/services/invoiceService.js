const Invoice = require("../models/Invoice");
const Counter = require("../models/Counter");

const assertFiniteNonNegative = (value, field) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${field} must be a finite, non-negative number`);
    error.status = 400;
    throw error;
  }

  return number;
};

const createInvoiceFromJobCard = async ({
  jobCard,
  discount = 0,
  tax = 0,
  session,
}) => {
  if (jobCard.status !== "completed" || !jobCard.isLocked) {
    const error = new Error(
      "Only completed and locked job cards can be invoiced"
    );
    error.status = 400;
    throw error;
  }

  if (!jobCard.customer?._id || !jobCard.vehicle?._id) {
    const error = new Error("Job card relationships are incomplete");
    error.status = 400;
    throw error;
  }

  const existingInvoice = await Invoice.findOne({
    jobCard: jobCard._id,
  }).session(session);

  if (existingInvoice) {
    return { invoice: existingInvoice, created: false };
  }

  const normalizedDiscount = assertFiniteNonNegative(discount, "Discount");
  const normalizedTax = assertFiniteNonNegative(tax, "Tax");
  const services = jobCard.services || [];
  const partsUsed = jobCard.partsUsed || [];

  const serviceTotal = services.reduce(
    (total, service) => total + assertFiniteNonNegative(service.cost || 0, "Service cost"),
    0
  );

  const parts = partsUsed.map((item) => ({
    part: item.part?._id || item.part,
    name: item.part?.name || "Unknown part",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: Number(item.quantity) * Number(item.unitPrice),
  }));

  const partsTotal = parts.reduce(
    (total, part) => total + assertFiniteNonNegative(part.totalPrice || 0, "Part total"),
    0
  );

  const subtotal = serviceTotal + partsTotal;
  const total = subtotal - normalizedDiscount + normalizedTax;

  if (total < 0) {
    const error = new Error("Invoice total cannot be negative");
    error.status = 400;
    throw error;
  }

  const counter = await Counter.findOneAndUpdate(
    { _id: "invoiceNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );

  const invoiceNumber = `INV-${String(counter.seq).padStart(5, "0")}`;
  const paymentStatus = total === 0 ? "paid" : "unpaid";
  const [invoice] = await Invoice.create(
    [{
      invoiceNumber,
      customer: jobCard.customer._id,
      vehicle: jobCard.vehicle._id,
      jobCard: jobCard._id,
      services,
      parts,
      subtotal,
      discount: normalizedDiscount,
      tax: normalizedTax,
      total,
      amountPaid: 0,
      balance: total,
      paymentStatus,
      status: "issued",
    }],
    { session }
  );

  return { invoice, created: true };
};

module.exports = {
  createInvoiceFromJobCard,
};