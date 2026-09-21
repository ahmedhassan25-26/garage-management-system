const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const createAuditLog = require("../utils/createAuditLog");
const { assertObjectId } = require("../utils/validation");

// Create payment
const createPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      invoiceId,
      amount,
      method,
      reference,
      notes,
    } = req.body;

    const idempotencyKey = req.get("Idempotency-Key");
    const normalizedAmount = Number(amount);

    if (!invoiceId || !method || !idempotencyKey) {
      return res.status(400).json({
        message:
          "Invoice ID, amount, payment method and Idempotency-Key are required",
      });
    }

    assertObjectId(invoiceId, "Invoice ID");

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than zero",
      });
    }

    let payment;
    let invoice;

    await session.withTransaction(async () => {
      const existingPayment = await Payment.findOne({
        idempotencyKey,
      }).session(session);

      if (existingPayment) {
        payment = existingPayment;
        invoice = await Invoice.findById(existingPayment.invoice).session(session);
        return;
      }

      const currentInvoice = await Invoice.findById(invoiceId).session(session);

      if (!currentInvoice) {
        const error = new Error("Invoice not found");
        error.status = 404;
        throw error;
      }

      if (currentInvoice.status === "cancelled") {
        const error = new Error("Cannot record payment for a cancelled invoice");
        error.status = 400;
        throw error;
      }

      invoice = await Invoice.findOneAndUpdate(
        {
          _id: invoiceId,
          balance: { $gte: normalizedAmount },
        },
        {
          $inc: {
            amountPaid: normalizedAmount,
            balance: -normalizedAmount,
          },
        },
        { new: true, session }
      );

      if (!invoice) {
        const error = new Error(
          `Payment cannot exceed the remaining balance of ${currentInvoice.balance}`
        );
        error.status = 400;
        throw error;
      }

      invoice.paymentStatus = invoice.balance === 0
        ? "paid"
        : "partially_paid";
      await invoice.save({ session });

      [payment] = await Payment.create(
        [{
          invoice: invoiceId,
          customer: invoice.customer,
          amount: normalizedAmount,
          method,
          reference,
          notes,
          idempotencyKey,
          receivedBy: req.user.userId,
        }],
        { session }
      );

      await createAuditLog({
        user: req.user.userId,
        action: "PAYMENT",
        module: "Payment",
        description: `Received payment of ${normalizedAmount} using ${method}`,
        recordId: payment._id,
        ipAddress: req.ip,
        session,
      });
    });

    // Get populated payment
    const populatedPayment =
      await Payment.findById(payment._id)
        .populate(
          "customer",
          "name phone"
        )
        .populate(
          "invoice",
          "invoiceNumber total balance paymentStatus"
        )
        .populate(
          "receivedBy",
          "name email"
        );

    // Send response
    res.status(201).json({
      message: "Payment recorded successfully",
      payment: populatedPayment,
      invoice: {
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        paymentStatus: invoice.paymentStatus,
      },
    });
  } catch (error) {
    console.error(
      "Create payment error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  } finally {
    await session.endSession();
  }
};

// Get all payments
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate(
        "customer",
        "name phone"
      )
      .populate(
        "invoice",
        "invoiceNumber total"
      )
      .populate(
        "receivedBy",
        "name email"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error(
      "Get payments error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};

// Get payments for one invoice
const getInvoicePayments = async (req, res) => {
  try {
    assertObjectId(req.params.invoiceId, "Invoice ID");
    const payments = await Payment.find({
      invoice: req.params.invoiceId,
    })
      .populate(
        "receivedBy",
        "name email"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error(
      "Get invoice payments error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getInvoicePayments,
};