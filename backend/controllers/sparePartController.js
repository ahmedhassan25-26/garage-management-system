const mongoose = require("mongoose");
const SparePart = require("../models/SparePart");
const JobCard = require("../models/JobCard");
const Invoice = require("../models/Invoice");
const createAuditLog = require("../utils/createAuditLog");
const { assertObjectId, finiteNumber } = require("../utils/validation");

// ==========================================
// Create spare part
// ==========================================
const createSparePart = async (req, res) => {
  try {
    const {
      name,
      partNumber,
      category,
      quantity,
      minimumStock,
      purchasePrice,
      sellingPrice,
      supplier,
      location,
      description,
    } = req.body;

    if (!name || !partNumber) {
      return res.status(400).json({
        message: "Name and part number are required",
      });
    }

    finiteNumber(quantity ?? 0, "Quantity", { min: 0 });
    finiteNumber(minimumStock ?? 0, "Minimum stock", { min: 0 });
    finiteNumber(purchasePrice ?? 0, "Purchase price", { min: 0 });
    finiteNumber(sellingPrice ?? 0, "Selling price", { min: 0 });
    if (Number(sellingPrice ?? 0) < Number(purchasePrice ?? 0)) {
      return res.status(400).json({
        message: "Selling price cannot be lower than purchase price",
      });
    }

    const existingPart = await SparePart.findOne({
      partNumber,
    });

    if (existingPart) {
      return res.status(400).json({
        message:
          "A spare part with this part number already exists",
      });
    }

    const sparePart = await SparePart.create({
      name,
      partNumber,
      category,
      quantity,
      minimumStock,
      purchasePrice,
      sellingPrice,
      supplier,
      location,
      description,
    });

    // Audit log
    await createAuditLog({
      user: req.user.userId,
      action: "CREATE",
      module: "SparePart",
      description: `Created spare part ${sparePart.name}`,
      recordId: sparePart._id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "Spare part created successfully",
      sparePart,
    });
  } catch (error) {
    console.error(
      "Create spare part error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Get all spare parts
// ==========================================
const getSpareParts = async (req, res) => {
  try {
    const spareParts = await SparePart.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: spareParts.length,
      spareParts,
    });
  } catch (error) {
    console.error(
      "Get spare parts error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Get one spare part
// ==========================================
const getSparePart = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Spare part ID");
    const sparePart = await SparePart.findById(
      req.params.id
    );

    if (!sparePart) {
      return res.status(404).json({
        message: "Spare part not found",
      });
    }

    res.status(200).json({
      sparePart,
    });
  } catch (error) {
    console.error(
      "Get spare part error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Update spare part
// ==========================================
const updateSparePart = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Spare part ID");
    const allowedFields = [
      "name", "category", "minimumStock", "purchasePrice", "sellingPrice",
      "supplier", "location", "description",
    ];
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );

    if (req.body.minimumStock !== undefined) finiteNumber(req.body.minimumStock, "Minimum stock", { min: 0 });
    if (req.body.purchasePrice !== undefined) finiteNumber(req.body.purchasePrice, "Purchase price", { min: 0 });
    if (req.body.sellingPrice !== undefined) finiteNumber(req.body.sellingPrice, "Selling price", { min: 0 });

    const currentPart = await SparePart.findById(req.params.id).select("purchasePrice");
    if (!currentPart) {
      return res.status(404).json({ message: "Spare part not found" });
    }

    const purchasePrice = req.body.purchasePrice ?? currentPart.purchasePrice;
    const existingPart = await SparePart.findById(req.params.id).select("sellingPrice");
    const sellingPrice = req.body.sellingPrice ?? existingPart.sellingPrice;
    if (Number(sellingPrice) < Number(purchasePrice)) {
      return res.status(400).json({
        message: "Selling price cannot be lower than purchase price",
      });
    }

    const sparePart =
      await SparePart.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!sparePart) {
      return res.status(404).json({
        message: "Spare part not found",
      });
    }

    // Audit log
    await createAuditLog({
      user: req.user.userId,
      action: "UPDATE",
      module: "SparePart",
      description: `Updated spare part ${sparePart.name}`,
      recordId: sparePart._id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "Spare part updated successfully",
      sparePart,
    });
  } catch (error) {
    console.error(
      "Update spare part error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Delete spare part
// ==========================================
const deleteSparePart = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Spare part ID");
    const references = await Promise.all([
      JobCard.exists({ "partsUsed.part": req.params.id }),
      Invoice.exists({ "parts.part": req.params.id }),
    ]);

    if (references.some(Boolean)) {
      return res.status(409).json({
        message: "Spare part cannot be deleted while related records exist",
      });
    }

    const sparePart =
      await SparePart.findByIdAndDelete(
        req.params.id
      );

    if (!sparePart) {
      return res.status(404).json({
        message: "Spare part not found",
      });
    }

    // Audit log
    await createAuditLog({
      user: req.user.userId,
      action: "DELETE",
      module: "SparePart",
      description: `Deleted spare part ${sparePart.name}`,
      recordId: sparePart._id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "Spare part deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete spare part error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Restock spare part
// ==========================================
const restockSparePart = async (req, res) => {
  let session;

  try {
    assertObjectId(req.params.id, "Spare part ID");
    finiteNumber(req.body.quantity, "Quantity", { min: 1 });

    const restockQty = Number(req.body.quantity);
    const reason = req.body.reason?.trim() || null;
    const supplier = req.body.supplier?.trim() || null;
    const reference = req.body.reference?.trim() || null;

    session = await mongoose.startSession();

    let restocked;

    await session.withTransaction(async () => {
      const part = await SparePart.findById(req.params.id).session(session);

      if (!part) {
        const error = new Error("Spare part not found");
        error.status = 404;
        throw error;
      }

      const previousQuantity = Number(part.quantity) || 0;

      const updated = await SparePart.findByIdAndUpdate(
        req.params.id,
        { $inc: { quantity: restockQty } },
        { new: true, runValidators: true, session }
      );

      await createAuditLog({
        user: req.user.userId,
        action: "STOCK_RESTOCKED",
        module: "SparePart",
        description: `Restocked ${restockQty} of ${part.name}`,
        recordId: part._id,
        ipAddress: req.ip,
        session,
        metadata: {
          partId: part._id,
          partName: part.name,
          quantityChanged: restockQty,
          previousQuantity,
          newQuantity: updated.quantity,
          reason,
          supplier,
          reference,
          context: "manual_restock",
        },
      });

      restocked = updated;
    });

    res.status(200).json({
      message: "Spare part restocked successfully",
      sparePart: restocked,
    });
  } catch (error) {
    if (error.status && error.status < 500) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    console.error("Restock spare part error:", error);

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    if (session) await session.endSession();
  }
};

// ==========================================
// Get low-stock parts
// ==========================================
const getLowStockParts = async (req, res) => {
  try {
    const spareParts = await SparePart.find({
      $expr: {
        $lte: [
          "$quantity",
          "$minimumStock",
        ],
      },
    }).sort({
      quantity: 1,
    });

    res.status(200).json({
      count: spareParts.length,
      spareParts,
    });
  } catch (error) {
    console.error(
      "Get low stock error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Export controllers
// ==========================================
module.exports = {
  createSparePart,
  getSpareParts,
  getSparePart,
  updateSparePart,
  deleteSparePart,
  restockSparePart,
  getLowStockParts,
};