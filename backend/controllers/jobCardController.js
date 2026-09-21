const mongoose = require("mongoose");
const JobCard = require("../models/JobCard");
const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const SparePart = require("../models/SparePart");
const Invoice = require("../models/Invoice");
const { createInvoiceFromJobCard } = require("../services/invoiceService");
const createAuditLog = require("../utils/createAuditLog");
const { assertObjectId, finiteNumber, validationError } = require("../utils/validation");

const sendError = (res, error, context) => {
  console.error(`${context}:`, error);

  const status =
    error.status ||
    (error.name === "ValidationError" || error.name === "CastError"
      ? 400
      : 500);

  res.status(status).json({
    message:
      error.status || status === 400
        ? error.message
        : "Server error",
  });
};

// Create job card
const calculateActualCost = (jobCard) => {
  const serviceTotal = (jobCard.services || []).reduce(
    (sum, item) => sum + Number(item.cost || 0),
    0
  );

  const partsTotal = (jobCard.partsUsed || []).reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );

  return serviceTotal + partsTotal;
};

const createJobCard = async (req, res) => {
  try {
    const {
      customer,
      vehicle,
      assignedMechanic,
      complaint,
      diagnosis,
      services,
      estimatedCost,
      notes,
    } = req.body;

    if (!customer || !vehicle || !complaint) {
      return res.status(400).json({
        message:
          "Customer, vehicle and complaint are required",
      });
    }

    assertObjectId(customer, "Customer ID");
    assertObjectId(vehicle, "Vehicle ID");
    if (assignedMechanic) assertObjectId(assignedMechanic, "Mechanic ID");
    finiteNumber(estimatedCost || 0, "Estimated cost", { min: 0 });

    // Check customer
    const customerExists = await Customer.findById(customer);

    if (!customerExists) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Check vehicle
    const vehicleExists = await Vehicle.findOne({
      _id: vehicle,
      customer,
    });

    if (!vehicleExists) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    // Check mechanic
    if (assignedMechanic) {
      const mechanic = await User.findOne({
        _id: assignedMechanic,
        role: "mechanic",
        isActive: true,
      });

      if (!mechanic) {
        return res.status(400).json({
          message: "Invalid mechanic",
        });
      }
    }

    const normalizedServices = Array.isArray(services) ? services : [];
    normalizedServices.forEach((service) => {
      if (!service?.description?.trim()) {
        throw validationError("Each service requires a description");
      }
      finiteNumber(service.cost ?? 0, "Service cost", { min: 0 });
    });
    const jobCard = await JobCard.create({
      customer,
      vehicle,
      assignedMechanic,
      complaint,
      diagnosis,
      services: normalizedServices,
      estimatedCost: Number(estimatedCost) || 0,
      notes,
      startDate: new Date(),
      actualCost: calculateActualCost({
        services: normalizedServices,
        partsUsed: [],
      }),
    });

    const populatedJobCard = await JobCard.findById(
      jobCard._id
    )
      .populate("customer", "name phone email")
      .populate(
        "vehicle",
        "make model year licensePlate mileage"
      )
      .populate(
        "assignedMechanic",
        "name email role"
      );

    res.status(201).json({
      message: "Job card created successfully",
      jobCard: populatedJobCard,
    });
  } catch (error) {
    sendError(res, error, "Create job card error");
  }
};

// Get all job cards
const getJobCards = async (req, res) => {
  try {
    const jobCards = await JobCard.find()
      .populate("customer", "name phone")
      .populate(
        "vehicle",
        "make model licensePlate"
      )
      .populate(
        "assignedMechanic",
        "name email"
      )
      .populate(
        "partsUsed.part",
        "name partNumber sellingPrice"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: jobCards.length,
      jobCards,
    });
  } catch (error) {
    sendError(res, error, "Get job cards error");
  }
};

// Get one job card
const getJobCard = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Job card ID");
    const jobCard = await JobCard.findById(req.params.id)
      .populate("customer", "name phone email")
      .populate(
        "vehicle",
        "make model year licensePlate mileage"
      )
      .populate(
        "assignedMechanic",
        "name email"
      )
      .populate(
        "partsUsed.part",
        "name partNumber sellingPrice"
      );

    if (!jobCard) {
      return res.status(404).json({
        message: "Job card not found",
      });
    }

    res.status(200).json({
      jobCard,
    });
  } catch (error) {
    sendError(res, error, "Get job card error");
  }
};

// Update job card
const updateJobCard = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Job card ID");
    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) {
      return res.status(404).json({
        message: "Job card not found",
      });
    }

    if (jobCard.isLocked) {
      return res.status(400).json({
        message:
          "Job card is completed and locked. Modifications are not allowed.",
      });
    }

    if (
      req.user?.role === "mechanic" &&
      (!jobCard.assignedMechanic ||
        String(jobCard.assignedMechanic) !== String(req.user.userId))
    ) {
      return res.status(403).json({
        message: "Access denied. Mechanics can only modify their assigned jobs.",
      });
    }

    // Only allow updating specific fields via this endpoint
    let allowed = [
      "customer",
      "vehicle",
      "assignedMechanic",
      "complaint",
      "diagnosis",
      "services",
      "estimatedCost",
      "notes",
    ];

    if (req.body.partsUsed !== undefined) {
      return res.status(400).json({
        message:
          "Spare parts cannot be edited through this endpoint. Use the parts endpoint instead.",
      });
    }

    // Mechanics have limited update permissions (view-only for customer/vehicle/assignment)
    if (req.user?.role === "mechanic") {
      allowed = ["diagnosis", "services", "notes"];
    }

    if (req.body.customer !== undefined) {
      assertObjectId(req.body.customer, "Customer ID");
    }
    if (req.body.vehicle !== undefined) {
      assertObjectId(req.body.vehicle, "Vehicle ID");
    }
    if (req.body.assignedMechanic !== undefined && req.body.assignedMechanic) {
      assertObjectId(req.body.assignedMechanic, "Mechanic ID");
    }
    if (req.body.estimatedCost !== undefined) {
      finiteNumber(req.body.estimatedCost, "Estimated cost", { min: 0 });
    }

    if (req.body.customer !== undefined || req.body.vehicle !== undefined) {
      const customerId = req.body.customer || jobCard.customer;
      const vehicleId = req.body.vehicle || jobCard.vehicle;
      const vehicleExists = await Vehicle.exists({
        _id: vehicleId,
        customer: customerId,
      });

      if (!vehicleExists) {
        return res.status(400).json({
          message: "Vehicle does not belong to the selected customer",
        });
      }
    }

    if (req.body.assignedMechanic) {
      const mechanicExists = await User.exists({
        _id: req.body.assignedMechanic,
        role: "mechanic",
        isActive: true,
      });

      if (!mechanicExists) {
        return res.status(400).json({ message: "Invalid mechanic" });
      }
    }

    if (req.body.services !== undefined) {
      if (!Array.isArray(req.body.services)) {
        return res.status(400).json({
          message: "Services must be an array",
        });
      }

      req.body.services.forEach((service) => {
        if (!service?.description?.trim()) {
          throw validationError(
            "Each service requires a description"
          );
        }
        finiteNumber(service.cost ?? 0, "Service cost", {
          min: 0,
        });
      });
    }

    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        jobCard[field] = req.body[field];
      }
    });

    jobCard.actualCost = calculateActualCost(jobCard);

    await jobCard.save();

    const populated = await JobCard.findById(jobCard._id)
      .populate("customer", "name phone")
      .populate("vehicle", "make model licensePlate")
      .populate("assignedMechanic", "name email");

    res.status(200).json({
      message: "Job card updated successfully",
      jobCard: populated,
    });
  } catch (error) {
    sendError(res, error, "Update job card error");
  }
};

// Delete job card
const deleteJobCard = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Job card ID");
    const [invoiceExists, existingJobCard] = await Promise.all([
      Invoice.exists({ jobCard: req.params.id }),
      JobCard.findById(req.params.id).select("partsUsed"),
    ]);

    if (invoiceExists) {
      return res.status(409).json({
        message: "Job card cannot be deleted while an invoice exists",
      });
    }

    if (existingJobCard?.partsUsed?.length) {
      return res.status(409).json({
        message: "Job card cannot be deleted after spare parts were used",
      });
    }
    const jobCard = await JobCard.findByIdAndDelete(
      req.params.id
    );

    if (!jobCard) {
      return res.status(404).json({
        message: "Job card not found",
      });
    }

    res.status(200).json({
      message: "Job card deleted successfully",
    });
  } catch (error) {
    sendError(res, error, "Delete job card error");
  }
};

const addPartToJobCard = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();

    const { partId, quantity } = req.body;

    if (!partId || !quantity) {
      return res.status(400).json({
        message: "Part ID and quantity are required",
      });
    }

    assertObjectId(req.params.id, "Job card ID");
    assertObjectId(partId, "Spare part ID");
    finiteNumber(quantity, "Quantity", { min: 1 });

    if (quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1",
      });
    }

    let remainingStock;
    let updatedJobCardId;

    await session.withTransaction(async () => {
      const jobCard = await JobCard.findById(req.params.id).session(session);

      if (!jobCard) {
        const error = new Error("Job card not found");
        error.status = 404;
        throw error;
      }

      if (jobCard.isLocked) {
        const error = new Error(
          "Cannot add parts to a completed job card. The job is locked."
        );
        error.status = 400;
        throw error;
      }

      if (
        req.user?.role === "mechanic" &&
        (!jobCard.assignedMechanic ||
          String(jobCard.assignedMechanic) !== String(req.user.userId))
      ) {
        const error = new Error(
          "Access denied. Mechanics can only modify their assigned jobs."
        );
        error.status = 403;
        throw error;
      }

      const sparePart = await SparePart.findOneAndUpdate(
        {
          _id: partId,
          quantity: { $gte: quantity },
        },
        { $inc: { quantity: -quantity } },
        { new: true, session }
      );

      if (!sparePart) {
        const existingPart = await SparePart.findById(partId).session(session);

        if (!existingPart) {
          const error = new Error("Spare part not found");
          error.status = 404;
          throw error;
        }

        const error = new Error(
          `Insufficient stock. Available: ${existingPart.quantity}`
        );
        error.status = 400;
        throw error;
      }

      jobCard.partsUsed.push({
        part: sparePart._id,
        quantity,
        unitPrice: sparePart.sellingPrice,
        totalPrice: sparePart.sellingPrice * quantity,
      });
      jobCard.actualCost = calculateActualCost(jobCard);
      await jobCard.save({ session });

      await createAuditLog({
        user: req.user.userId,
        action: "STOCK_DEDUCTED",
        module: "SparePart",
        description: `Deducted ${quantity} of ${sparePart.name} for job card`,
        recordId: sparePart._id,
        ipAddress: req.ip,
        session,
        metadata: {
          partId: sparePart._id,
          partName: sparePart.name,
          quantityChanged: -quantity,
          previousQuantity: sparePart.quantity + quantity,
          newQuantity: sparePart.quantity,
          jobCardId: jobCard._id,
          context: "job_card_consumption",
        },
      });

      remainingStock = sparePart.quantity;
      updatedJobCardId = jobCard._id;
    });

    const updatedJobCard = await JobCard.findById(updatedJobCardId)
      .populate("customer", "name phone")
      .populate(
        "vehicle",
        "make model licensePlate"
      )
      .populate(
        "assignedMechanic",
        "name email"
      )
      .populate(
        "partsUsed.part",
        "name partNumber sellingPrice"
      );

    res.status(200).json({
      message: "Spare part added to job card successfully",
      jobCard: updatedJobCard,
      remainingStock,
    });
  } catch (error) {
    sendError(res, error, "Add part error");
  } finally {
    if (session) await session.endSession();
  }
};

// Change job card status (manage transitions and finalization)
const changeJobCardStatus = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();

    assertObjectId(req.params.id, "Job card ID");
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const allowed = [
      "pending",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    let jobCardId;
    let createdInvoice = null;

    await session.withTransaction(async () => {
      const jobCard = await JobCard.findById(req.params.id)
        .populate("customer")
        .populate("vehicle")
        .populate("partsUsed.part", "name partNumber sellingPrice")
        .session(session);

      if (!jobCard) {
        const error = new Error("Job card not found");
        error.status = 404;
        throw error;
      }

      if (jobCard.isLocked) {
        const error = new Error("Job card is locked and cannot change status.");
        error.status = 400;
        throw error;
      }

      if (
        req.user?.role === "mechanic" &&
        (!jobCard.assignedMechanic ||
          String(jobCard.assignedMechanic) !== String(req.user.userId))
      ) {
        const error = new Error(
          "Access denied. Mechanics can only change status of their assigned jobs."
        );
        error.status = 403;
        throw error;
      }

      if (jobCard.status === "completed" || jobCard.status === "cancelled") {
        const error = new Error("Cannot change status of a finalized job");
        error.status = 400;
        throw error;
      }

      if (status === "in_progress") {
        if (jobCard.status !== "pending") {
          const error = new Error("Only pending jobs can be started");
          error.status = 400;
          throw error;
        }
        if (!jobCard.startDate) jobCard.startDate = new Date();
        jobCard.status = "in_progress";
      }

      if (status === "completed") {
        if (jobCard.status !== "in_progress") {
          const error = new Error("Only in-progress jobs can be completed");
          error.status = 400;
          throw error;
        }
        jobCard.completionDate = new Date();
        jobCard.actualCost = calculateActualCost(jobCard);
        jobCard.status = "completed";
        jobCard.isLocked = true;
        jobCard.readyForInvoicing = true;

        const invoiceResult = await createInvoiceFromJobCard({
          jobCard,
          session,
        });
        createdInvoice = invoiceResult.invoice;
      }

      if (status === "cancelled") {
        const claimedForRestore = await JobCard.findOneAndUpdate(
          {
            _id: jobCard._id,
            status: { $ne: "cancelled" },
            stockRestored: { $ne: true },
          },
          { $set: { stockRestored: true } },
          { new: true, session }
        );

        if (claimedForRestore) {
          for (const item of jobCard.partsUsed || []) {
            const partId = item.part?._id || item.part;
            if (!partId) continue;

            const qty = Number(item.quantity) || 0;
            const partName = item.part?.name || "spare part";

            const restored = await SparePart.findByIdAndUpdate(
              partId,
              { $inc: { quantity: qty } },
              { new: true, session, runValidators: true }
            );

            if (qty > 0 && restored) {
              await createAuditLog({
                user: req.user.userId,
                action: "STOCK_RESTORED_AFTER_CANCELLATION",
                module: "SparePart",
                description: `Restored ${qty} of ${partName} after job card cancellation`,
                recordId: partId,
                ipAddress: req.ip,
                session,
                metadata: {
                  partId,
                  partName,
                  quantityChanged: qty,
                  previousQuantity: Number(restored.quantity) - qty,
                  newQuantity: restored.quantity,
                  jobCardId: jobCard._id,
                  context: "job_card_cancellation",
                },
              });
            }
          }
        }

        jobCard.status = "cancelled";
        jobCard.isLocked = true;
      }

      jobCardId = jobCard._id;

      await jobCard.save({ session });
    });

    const populated = await JobCard.findById(jobCardId)
      .populate("customer", "name phone")
      .populate("vehicle", "make model licensePlate")
      .populate("assignedMechanic", "name email")
      .populate("partsUsed.part", "name partNumber sellingPrice");

    if (createdInvoice) {
      createdInvoice = await Invoice.findById(createdInvoice._id)
        .populate("customer", "name phone email")
        .populate("vehicle", "make model licensePlate")
        .populate("jobCard", "complaint status");
    }

    res.status(200).json({
      message: "Job card status updated",
      jobCard: populated,
      invoice: createdInvoice,
    });
  } catch (error) {
    sendError(res, error, "Change status error");
  } finally {
    if (session) await session.endSession();
  }
};

module.exports = {
  createJobCard,
  getJobCards,
  getJobCard,
  updateJobCard,
  deleteJobCard,
  addPartToJobCard,
  changeJobCardStatus,
};