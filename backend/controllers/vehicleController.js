const Vehicle = require("../models/Vehicle");
const Customer = require("../models/Customer");
const JobCard = require("../models/JobCard");
const Invoice = require("../models/Invoice");
const createAuditLog = require("../utils/createAuditLog");
const { assertObjectId, finiteNumber } = require("../utils/validation");

const sendError = (res, error) => {
  res.status(error.status || 500).json({
    message: error.status ? error.message : "Server error",
  });
};

const createVehicle = async (req, res) => {
  try {
    const { customer, make, model, year, licensePlate, vin, color, mileage } = req.body;

    if (!customer || !make?.trim() || !model?.trim() || !year || !licensePlate?.trim()) {
      return res.status(400).json({ message: "Customer, make, model, year and license plate are required" });
    }

    assertObjectId(customer, "Customer ID");
    finiteNumber(year, "Year", { min: 1886 });
    finiteNumber(mileage ?? 0, "Mileage", { min: 0 });

    if (!(await Customer.exists({ _id: customer }))) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (await Vehicle.exists({ licensePlate: licensePlate.trim().toUpperCase() })) {
      return res.status(400).json({ message: "A vehicle with this license plate already exists" });
    }

    const vehicle = await Vehicle.create({ customer, make, model, year, licensePlate, vin, color, mileage });

    await createAuditLog({
      user: req.user.userId,
      action: "CREATE",
      module: "Vehicle",
      description: `Registered vehicle ${vehicle.make} ${vehicle.model}`,
      recordId: vehicle._id,
      ipAddress: req.ip,
    });

    res.status(201).json({ message: "Vehicle created successfully", vehicle });
  } catch (error) {
    console.error("Create vehicle error:", error);
    sendError(res, error);
  }
};

const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate("customer", "name phone email")
      .sort({ createdAt: -1 });
    res.status(200).json({ count: vehicles.length, vehicles });
  } catch (error) {
    console.error("Get vehicles error:", error);
    sendError(res, error);
  }
};

const getVehicle = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Vehicle ID");
    const vehicle = await Vehicle.findById(req.params.id).populate("customer", "name phone email");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json({ vehicle });
  } catch (error) {
    console.error("Get vehicle error:", error);
    sendError(res, error);
  }
};

const getCustomerVehicles = async (req, res) => {
  try {
    assertObjectId(req.params.customerId, "Customer ID");
    const vehicles = await Vehicle.find({ customer: req.params.customerId }).sort({ createdAt: -1 });
    res.status(200).json({ count: vehicles.length, vehicles });
  } catch (error) {
    console.error("Get customer vehicles error:", error);
    sendError(res, error);
  }
};

const updateVehicle = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Vehicle ID");

    if (req.body.customer) {
      assertObjectId(req.body.customer, "Customer ID");
      if (!(await Customer.exists({ _id: req.body.customer }))) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const currentVehicle = await Vehicle.findById(req.params.id).select("customer");
      if (!currentVehicle) return res.status(404).json({ message: "Vehicle not found" });

      if (String(currentVehicle.customer) !== String(req.body.customer)) {
        const references = await Promise.all([
          JobCard.exists({ vehicle: req.params.id }),
          Invoice.exists({ vehicle: req.params.id }),
        ]);
        if (references.some(Boolean)) {
          return res.status(409).json({ message: "Vehicle ownership cannot change while related records exist" });
        }
      }
    }

    if (req.body.year !== undefined) finiteNumber(req.body.year, "Year", { min: 1886 });
    if (req.body.mileage !== undefined) finiteNumber(req.body.mileage, "Mileage", { min: 0 });

    const allowedFields = ["customer", "make", "model", "year", "licensePlate", "vin", "color", "mileage"];
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (updates.licensePlate) updates.licensePlate = updates.licensePlate.toUpperCase();
    if (updates.vin) updates.vin = updates.vin.toUpperCase();

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("customer", "name phone email");

    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    await createAuditLog({
      user: req.user.userId,
      action: "UPDATE",
      module: "Vehicle",
      description: `Updated vehicle ${vehicle.make} ${vehicle.model}`,
      recordId: vehicle._id,
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "Vehicle updated successfully", vehicle });
  } catch (error) {
    console.error("Update vehicle error:", error);
    sendError(res, error);
  }
};

const deleteVehicle = async (req, res) => {
  try {
    assertObjectId(req.params.id, "Vehicle ID");
    const references = await Promise.all([
      JobCard.exists({ vehicle: req.params.id }),
      Invoice.exists({ vehicle: req.params.id }),
    ]);
    if (references.some(Boolean)) {
      return res.status(409).json({ message: "Vehicle cannot be deleted while related records exist" });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    await createAuditLog({
      user: req.user.userId,
      action: "DELETE",
      module: "Vehicle",
      description: `Deleted vehicle ${vehicle.make} ${vehicle.model}`,
      recordId: vehicle._id,
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    sendError(res, error);
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicle,
  getCustomerVehicles,
  updateVehicle,
  deleteVehicle,
};
