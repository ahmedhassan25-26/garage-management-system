const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");
const JobCard = require("../models/JobCard");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const createAuditLog = require("../utils/createAuditLog");
const { assertObjectId } = require("../utils/validation");

// Create customer
const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      notes,
    } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        message: "Name and phone are required",
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      notes,
    });

    // Create audit log
    await createAuditLog({
      user: req.user.userId,
      action: "CREATE",
      module: "Customer",
      description: `Created customer ${customer.name}`,
      recordId: customer._id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error(
      "Create customer error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error(
      "Get customers error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};

// Get one customer
const getCustomer = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Customer ID");
    const customer = await Customer.findById(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      customer,
    });
  } catch (error) {
    console.error(
      "Get customer error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Customer ID");
    const allowedFields = ["name", "phone", "email", "address", "notes"];
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );

    const customer =
      await Customer.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error(
      "Update customer error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Customer ID");
    const references = await Promise.all([
      Vehicle.exists({ customer: req.params.id }),
      JobCard.exists({ customer: req.params.id }),
      Invoice.exists({ customer: req.params.id }),
      Payment.exists({ customer: req.params.id }),
    ]);

    if (references.some(Boolean)) {
      return res.status(409).json({
        message: "Customer cannot be deleted while related records exist",
      });
    }

    const customer =
      await Customer.findByIdAndDelete(
        req.params.id
      );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete customer error:",
      error
    );

    res.status(error.status || 500).json({
      message: error.status ? error.message : "Server error",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};