const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const jobCardRoutes = require("./routes/jobCardRoutes");
const sparePartRoutes = require("./routes/sparePartRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const reportsRoutes = require("./routes/reportsRoutes");

const app = express();

const jwtSecret = process.env.JWT_SECRET;
const isPlaceholderSecret =
  !jwtSecret ||
  jwtSecret === "replace-with-a-long-random-secret" ||
  jwtSecret.length < 32;

if (isPlaceholderSecret) {
  throw new Error(
    "JWT_SECRET must be configured with a random value of at least 32 characters"
  );
}

const configuredOrigins = (
  process.env.CLIENT_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:5173")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
  throw new Error("CLIENT_URL must be configured in production");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/job-cards", jobCardRoutes);
app.use("/api/spare-parts", sparePartRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Garage Management System API is running",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled API error:", error);
  res.status(error.status || 500).json({
    message: error.status ? error.message : "An unexpected server error occurred.",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
};

startServer().catch((error) => {
  console.error("Unable to start server:", error);
  process.exit(1);
});
