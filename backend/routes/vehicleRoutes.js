const express = require("express");

const {
  createVehicle,
  getVehicles,
  getVehicle,
  getCustomerVehicles,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

// Get all vehicles
router.get("/", protect, authorizePermission("vehicles.view"), getVehicles);

// Get vehicles belonging to a customer
router.get(
  "/customer/:customerId",
  protect,
  authorizePermission("vehicles.view"),
  getCustomerVehicles
);

// Get one vehicle
router.get("/:id", protect, authorizePermission("vehicles.view"), getVehicle);

// Create vehicle
router.post(
  "/",
  protect,
  authorizePermission("vehicles.manage"),
  createVehicle
);

// Update vehicle
router.put(
  "/:id",
  protect,
  authorizePermission("vehicles.manage"),
  updateVehicle
);

// Delete vehicle
router.delete(
  "/:id",
  protect,
  authorizePermission("vehicles.delete"),
  deleteVehicle
);

module.exports = router;