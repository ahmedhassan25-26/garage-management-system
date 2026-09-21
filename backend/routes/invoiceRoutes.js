const express = require("express");

const {
  createInvoice,
  getInvoices,
  getInvoice,
  deleteInvoice,
} = require("../controllers/invoiceController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizePermission("invoices.view"),
  getInvoices
);

router.get(
  "/:id",
  protect,
  authorizePermission("invoices.view"),
  getInvoice
);

router.post(
  "/",
  protect,
  authorizePermission("invoices.create"),
  createInvoice
);

router.delete(
  "/:id",
  protect,
  authorizePermission("invoices.delete"),
  deleteInvoice
);

module.exports = router;