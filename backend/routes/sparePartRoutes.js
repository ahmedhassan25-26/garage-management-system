const express = require("express");

const {
  createSparePart,
  getSpareParts,
  getSparePart,
  updateSparePart,
  deleteSparePart,
  restockSparePart,
  getLowStockParts,
} = require("../controllers/sparePartController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

// Get all spare parts
// Allow mechanics and receptionists to view parts; write operations restricted
router.get("/", protect, authorizePermission("inventory.view"), getSpareParts);

// Get low-stock parts
router.get("/low-stock", protect, authorizePermission("inventory.view"), getLowStockParts);

// Get one spare part
router.get("/:id", protect, authorizePermission("inventory.view"), getSparePart);

// Create spare part
router.post(
  "/",
  protect,
  authorizePermission("inventory.manage"),
  createSparePart
);

// Update spare part
router.put(
  "/:id",
  protect,
  authorizePermission("inventory.manage"),
  updateSparePart
);

// Restock spare part
router.post(
  "/:id/restock",
  protect,
  authorizePermission("inventory.manage"),
  restockSparePart
);

// Delete spare part
router.delete(
  "/:id",
  protect,
  authorizePermission("inventory.manage"),
  deleteSparePart
);

module.exports = router;