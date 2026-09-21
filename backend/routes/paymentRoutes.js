const express = require("express");

const {
  createPayment,
  getPayments,
  getInvoicePayments,
} = require("../controllers/paymentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizePermission("payments.view"),
  getPayments
);

router.get(
  "/invoice/:invoiceId",
  protect,
  authorizePermission("payments.view"),
  getInvoicePayments
);

router.post(
  "/",
  protect,
  authorizePermission("payments.create"),
  createPayment
);

module.exports = router;