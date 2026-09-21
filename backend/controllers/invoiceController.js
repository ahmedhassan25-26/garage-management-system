const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const JobCard = require("../models/JobCard");
const { createInvoiceFromJobCard } = require("../services/invoiceService");
const { assertObjectId } = require("../utils/validation");

// Create invoice
const createInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      jobCardId,
      discount = 0,
      tax = 0,
    } = req.body;

    if (!jobCardId) {
      return res.status(400).json({
        message: "Job card ID is required",
      });
    }

    assertObjectId(jobCardId, "Job card ID");

    let invoice;

    await session.withTransaction(async () => {
      const jobCard = await JobCard.findById(jobCardId)
        .populate("customer")
        .populate("vehicle")
        .populate("partsUsed.part")
        .session(session);

      if (!jobCard) {
        const error = new Error("Job card not found");
        error.status = 404;
        throw error;
      }

      const result = await createInvoiceFromJobCard({
        jobCard,
        discount,
        tax,
        session,
      });

      if (!result.created) {
        const error = new Error("Invoice already exists for this job card");
        error.status = 409;
        throw error;
      }

      invoice = result.invoice;
    });

    const populatedInvoice =
      await Invoice.findById(invoice._id)
        .populate(
          "customer",
          "name phone email"
        )
        .populate(
          "vehicle",
          "make model licensePlate"
        )
        .populate(
          "jobCard",
          "complaint status"
        );

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: populatedInvoice,
    });
  } catch (error) {
    console.error(
      "Create invoice error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  } finally {
    await session.endSession();
  }
};


// Get all invoices
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate(
        "customer",
        "name phone"
      )
      .populate(
        "vehicle",
        "make model licensePlate"
      )
      .populate(
        "jobCard",
        "complaint status"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error(
      "Get invoices error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};


// Get one invoice
const getInvoice = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Invoice ID");
    const invoice = await Invoice.findById(
      req.params.id
    )
      .populate(
        "customer",
        "name phone email"
      )
      .populate(
        "vehicle",
        "make model licensePlate"
      )
      .populate(
        "jobCard"
      )
      .populate(
        "parts.part",
        "name partNumber"
      );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      invoice,
    });
  } catch (error) {
    console.error(
      "Get invoice error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};


// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Invoice ID");
    const invoice = await Invoice.findById(
      req.params.id
    );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // Prevent deleting an invoice that has payments
    if (invoice.amountPaid > 0) {
      return res.status(400).json({
        message:
          "Cannot delete an invoice that has payments",
      });
    }

    await Invoice.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message: "Invoice deleted successfully",
      invoiceId: req.params.id,
    });
  } catch (error) {
    console.error(
      "Delete invoice error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};


module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  deleteInvoice,
};