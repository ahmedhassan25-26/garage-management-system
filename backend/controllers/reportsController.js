const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const JobCard = require("../models/JobCard");
const SparePart = require("../models/SparePart");
const User = require("../models/User");

// Helper to get start of day
const startOfDay = (d) => {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
};

const parseDate = (d) => {
  if (!d) return null;
  const t = new Date(d);
  if (isNaN(t.getTime())) return null;
  return t;
};

// Helper: build reports with optional date range
const buildReports = async (opts = {}) => {
  const { startDate, endDate, inventoryPage = 1, inventoryLimit = 10, partsPage = 1, partsLimit = 10 } = opts;

  const today = startOfDay(new Date());

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  const monthStart = new Date(today);
  monthStart.setDate(1);

  const paymentsMatch = {};
  if (startDate || endDate) {
    paymentsMatch.createdAt = {};
    if (startDate) paymentsMatch.createdAt.$gte = startDate;
    if (endDate) paymentsMatch.createdAt.$lte = endDate;
  }

  // Financial
  const [
    todayPaymentsAgg,
    weekPaymentsAgg,
    monthPaymentsAgg,
    outstandingAgg,
    paidInvoicesCount,
    unpaidInvoicesCount,
  ] = await Promise.all([
    Payment.aggregate([
      { $match: Object.keys(paymentsMatch).length ? paymentsMatch : { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: Object.keys(paymentsMatch).length ? paymentsMatch : { createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: Object.keys(paymentsMatch).length ? paymentsMatch : { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Invoice.aggregate([
      { $match: { balance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]),
    Invoice.countDocuments({ paymentStatus: "paid" }),
    Invoice.countDocuments({ paymentStatus: { $ne: "paid" } }),
  ]);

  const financial = {
    dailyRevenue: todayPaymentsAgg.length > 0 ? todayPaymentsAgg[0].total : 0,
    weeklyRevenue: weekPaymentsAgg.length > 0 ? weekPaymentsAgg[0].total : 0,
    monthlyRevenue: monthPaymentsAgg.length > 0 ? monthPaymentsAgg[0].total : 0,
    outstandingPayments: outstandingAgg.length > 0 ? outstandingAgg[0].total : 0,
    paidInvoices: paidInvoicesCount,
    unpaidInvoices: unpaidInvoicesCount,
  };

  // Operations
  const [totalJobs, completedJobs, cancelledJobs, avgJobAgg, topVehicles] = await Promise.all([
    JobCard.countDocuments(),
    JobCard.countDocuments({ status: "completed" }),
    JobCard.countDocuments({ status: "cancelled" }),
    JobCard.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, avg: { $avg: "$actualCost" } } },
    ]),
    JobCard.aggregate([
      { $group: { _id: "$vehicle", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "vehicles", localField: "_id", foreignField: "_id", as: "vehicle" } },
      { $unwind: { path: "$vehicle", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, vehicleId: "$_id", count: 1, make: "$vehicle.make", model: "$vehicle.model", licensePlate: "$vehicle.licensePlate" } },
    ]),
  ]);

  const operations = {
    totalJobs,
    completedJobs,
    cancelledJobs,
    averageJobValue: avgJobAgg.length > 0 ? avgJobAgg[0].avg : 0,
    mostServicedVehicles: topVehicles,
  };

  // Inventory
  // Inventory: apply pagination server-side for current stock and parts consumed
  const skipInventory = (Number(inventoryPage) - 1) * Number(inventoryLimit);
  const skipParts = (Number(partsPage) - 1) * Number(partsLimit);

  const [
    currentStockDocs,
    currentStockTotal,
    lowStockParts,
    partsConsumedFacet,
    inventoryValueAgg,
  ] = await Promise.all([
    SparePart.find().select("name partNumber quantity purchasePrice sellingPrice").skip(skipInventory).limit(Number(inventoryLimit)).lean(),
    SparePart.countDocuments(),
    SparePart.find({ $expr: { $lte: ["$quantity", "$minimumStock"] } }).select("name quantity minimumStock").lean(),
    JobCard.aggregate([
      { $unwind: "$partsUsed" },
      { $group: { _id: "$partsUsed.part", consumed: { $sum: "$partsUsed.quantity" } } },
      { $lookup: { from: "spareparts", localField: "_id", foreignField: "_id", as: "part" } },
      { $unwind: { path: "$part", preserveNullAndEmptyArrays: true } },
      { $project: { partId: "$_id", name: "$part.name", consumed: 1 } },
      { $sort: { consumed: -1 } },
      { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: skipParts }, { $limit: Number(partsLimit) }] } },
    ]),
    SparePart.aggregate([
      { $project: { value: { $multiply: ["$quantity", { $ifNull: ["$purchasePrice", 0] }] } } },
      { $group: { _id: null, totalValue: { $sum: "$value" } } },
    ]),
  ]);

  const partsConsumed = (partsConsumedFacet[0] && partsConsumedFacet[0].data) || [];
  const partsConsumedTotal = (partsConsumedFacet[0] && partsConsumedFacet[0].metadata && partsConsumedFacet[0].metadata[0] && partsConsumedFacet[0].metadata[0].total) || 0;

  const inventory = {
    currentStock: currentStockDocs,
    currentStockTotal,
    lowStockParts,
    partsConsumed,
    partsConsumedTotal,
    inventoryValue: inventoryValueAgg.length > 0 ? inventoryValueAgg[0].totalValue : 0,
  };

  // Mechanics
  const mechanicsAgg = await JobCard.aggregate([
    {
      $group: {
        _id: "$assignedMechanic",
        totalAssigned: { $sum: 1 },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "mechanic" } },
    { $unwind: { path: "$mechanic", preserveNullAndEmptyArrays: true } },
    { $project: { mechanicId: "$_id", name: "$mechanic.name", totalAssigned: 1, inProgress: 1, completed: 1 } },
  ]);

  const revenuePerMechanic = await Invoice.aggregate([
    { $lookup: { from: "jobcards", localField: "jobCard", foreignField: "_id", as: "jobCard" } },
    { $unwind: { path: "$jobCard", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$jobCard.assignedMechanic", revenue: { $sum: "$total" } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "mechanic" } },
    { $unwind: { path: "$mechanic", preserveNullAndEmptyArrays: true } },
    { $project: { mechanicId: "$_id", name: "$mechanic.name", revenue: 1 } },
  ]);

  const mechanics = mechanicsAgg.map((m) => {
    const rev = revenuePerMechanic.find((r) => String(r.mechanicId) === String(m.mechanicId));
    return {
      mechanicId: m.mechanicId,
      name: m.name || "Unassigned",
      jobsAssigned: m.totalAssigned,
      jobsInProgress: m.inProgress,
      jobsCompleted: m.completed,
      revenue: rev ? rev.revenue : 0,
    };
  });

  return { financial, operations, inventory, mechanics };
};

const getReports = async (req, res) => {
  try {
    const startDate = parseDate(req.query.startDate);
    const endDate = parseDate(req.query.endDate);
    const inventoryPage = parseInt(req.query.inventoryPage || "1", 10);
    const inventoryLimit = parseInt(req.query.inventoryLimit || "10", 10);
    const partsPage = parseInt(req.query.partsPage || "1", 10);
    const partsLimit = parseInt(req.query.partsLimit || "10", 10);

    const reports = await buildReports({ startDate, endDate, inventoryPage, inventoryLimit, partsPage, partsLimit });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Reports error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export CSV
const exportReports = async (req, res) => {
  try {
    const startDate = parseDate(req.query.startDate);
    const endDate = parseDate(req.query.endDate);
    const reports = await buildReports({ startDate, endDate });

    // Build CSV: simple multi-section CSV with headers
    let rows = [];

    rows.push(["Financial"]);
    rows.push(["Metric", "Value"]);
    Object.entries(reports.financial).forEach(([k, v]) => rows.push([k, v]));
    rows.push([]);

    rows.push(["Operations"]);
    rows.push(["Metric", "Value"]);
    Object.entries(reports.operations).forEach(([k, v]) => {
      if (k === "mostServicedVehicles") return;
      rows.push([k, v]);
    });
    rows.push([]);

    rows.push(["Most Serviced Vehicles"]);
    rows.push(["Make", "Model", "LicensePlate", "Count"]);
    (reports.operations.mostServicedVehicles || []).forEach((v) => rows.push([v.make, v.model, v.licensePlate, v.count]));
    rows.push([]);

    rows.push(["Inventory"]);
    rows.push(["Metric", "Value"]);
    rows.push(["CurrentStockCount", reports.inventory.currentStock.length]);
    rows.push(["LowStockCount", reports.inventory.lowStockParts.length]);
    rows.push(["PartsConsumedDistinct", reports.inventory.partsConsumed.length]);
    rows.push(["InventoryValue", reports.inventory.inventoryValue]);
    rows.push([]);

    rows.push(["Top Consumed Parts"]);
    rows.push(["Part", "Consumed"]);
    (reports.inventory.partsConsumed || []).forEach((p) => rows.push([p.name, p.consumed]));
    rows.push([]);

    rows.push(["Mechanics"]);
    rows.push(["Name", "Assigned", "InProgress", "Completed", "Revenue"]);
    (reports.mechanics || []).forEach((m) => rows.push([m.name, m.jobsAssigned, m.jobsInProgress, m.jobsCompleted, m.revenue]));

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="reports.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("Export reports error:", err);
    res.status(500).json({ message: "Export failed" });
  }
};

module.exports = { getReports, exportReports };
