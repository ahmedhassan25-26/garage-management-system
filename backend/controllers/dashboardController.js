const User = require("../models/User");
const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");
const JobCard = require("../models/JobCard");
const SparePart = require("../models/SparePart");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalMechanics,
      totalCustomers,
      totalVehicles,
      totalJobs,
      pendingJobs,
      activeJobs,
      completedJobs,
      totalSpareParts,
      lowStockParts,
      totalInvoices,
      unpaidInvoices,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "mechanic",
      }),

      Customer.countDocuments(),

      Vehicle.countDocuments(),

      JobCard.countDocuments(),

      JobCard.countDocuments({
        status: "pending",
      }),

      JobCard.countDocuments({
        status: "in_progress",
      }),

      JobCard.countDocuments({
        status: "completed",
      }),

      SparePart.countDocuments(),

      SparePart.countDocuments({
        $expr: {
          $lte: [
            "$quantity",
            "$minimumStock",
          ],
        },
      }),

      Invoice.countDocuments(),

      Invoice.countDocuments({
        paymentStatus: {
          $ne: "paid",
        },
      }),
    ]);

    // Total revenue (all payments)
    const revenueResult = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Pending revenue (invoice balances)
    const pendingRevenueResult = await Invoice.aggregate([
      { $match: { balance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const pendingRevenue = pendingRevenueResult.length > 0 ? pendingRevenueResult[0].total : 0;

    // Low stock parts details (top 5 by lowest quantity)
    const lowStockPartsList = await SparePart.find({
      $expr: { $lte: ["$quantity", "$minimumStock"] },
    })
      .select("name quantity minimumStock")
      .sort({ quantity: 1 })
      .limit(5)
      .lean();

    // Today's revenue and last 7 days revenue (by day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const revenueByDay = await Payment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Map to last 7 days with zeros for missing days
    const recentRevenue = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(sevenDaysAgo);
      dt.setDate(sevenDaysAgo.getDate() + d);
      const key = dt.toISOString().slice(0, 10);
      const found = revenueByDay.find((r) => r._id === key);
      recentRevenue.push({ date: key, total: found ? found.total : 0 });
    }

    const todayRevenue = recentRevenue[recentRevenue.length - 1].total || 0;

    res.status(200).json({
      dashboard: {
        users: {
          total: totalUsers,
          mechanics: totalMechanics,
        },

        customers: totalCustomers,

        vehicles: totalVehicles,

        jobs: {
          total: totalJobs,
          pending: pendingJobs,
          active: activeJobs,
          completed: completedJobs,
        },

        inventory: {
          totalParts: totalSpareParts,
          lowStock: lowStockParts,
          lowStockParts: lowStockPartsList,
        },

        invoices: {
          total: totalInvoices,
          unpaid: unpaidInvoices,
        },

        financial: {
          totalRevenue,
          pendingRevenue,
          todayRevenue,
          recentRevenue,
        },
      },
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getDashboardStats,
};