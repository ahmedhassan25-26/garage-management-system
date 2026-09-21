const express = require("express");

const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

// Get all customers
// Viewing customers available to authenticated users (mechanics get view-only)
router.get("/", protect, authorizePermission("customers.view"), getCustomers);

// Get one customer
router.get("/:id", protect, authorizePermission("customers.view"), getCustomer);

// Create customer
router.post(
  "/",
  protect,
  authorizePermission("customers.manage"),
  createCustomer
);

// Update customer
router.put(
  "/:id",
  protect,
  authorizePermission("customers.manage"),
  updateCustomer
);

// Delete customer
router.delete(
  "/:id",
  protect,
  authorizePermission("customers.delete"),
  deleteCustomer
);

module.exports = router;