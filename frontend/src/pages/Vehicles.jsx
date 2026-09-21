import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Car, User, RefreshCw, Filter } from "lucide-react";

import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import Avatar from "../components/Avatar";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import SearchBar from "../components/SearchBar";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";
import "./Vehicles.css";

const emptyForm = {
  customer: "",
  make: "",
  model: "",
  year: "",
  licensePlate: "",
  vin: "",
  color: "",
  mileage: 0,
};

const Vehicles = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [makeFilter, setMakeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/vehicles");

      setVehicles(response.data.vehicles || []);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");

      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to load customers");
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchCustomers();
  }, []);

  const resetForm = () => setForm(emptyForm);

  const openAddModal = () => {
    setEditingVehicle(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);

    setForm({
      customer:
        vehicle.customer?._id ||
        vehicle.customer ||
        "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      licensePlate: vehicle.licensePlate || "",
      vin: vehicle.vin || "",
      color: vehicle.color || "",
      mileage: vehicle.mileage || 0,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const data = {
        customer: form.customer,
        make: form.make,
        model: form.model,
        year: Number(form.year),
        licensePlate: form.licensePlate.toUpperCase(),
        vin: form.vin ? form.vin.toUpperCase() : "",
        color: form.color,
        mileage: Number(form.mileage) || 0,
      };

      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle._id}`, data);
      } else {
        await api.post("/vehicles", data);
      }

      closeModal();
      toast.success(
        editingVehicle
          ? "Vehicle updated successfully."
          : "Vehicle added successfully."
      );
      await fetchVehicles();
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message || "Failed to save vehicle");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      setError("");

      await api.delete(`/vehicles/${confirmDelete}`);

      setConfirmDelete(null);
      toast.success("Vehicle deleted successfully.");
      await fetchVehicles();
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message || "Failed to delete vehicle");
    }
  };

  const makes = [
    ...new Set(
      vehicles
        .map((vehicle) => vehicle.make)
        .filter(Boolean)
        .sort()
    ),
  ];

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = search.toLowerCase();

    const matchesSearch =
      vehicle.make?.toLowerCase().includes(query) ||
      vehicle.model?.toLowerCase().includes(query) ||
      vehicle.licensePlate?.toLowerCase().includes(query) ||
      vehicle.customer?.name?.toLowerCase().includes(query);

    const matchesMake =
      makeFilter === "all" || vehicle.make === makeFilter;

    return matchesSearch && matchesMake;
  });

  return (
    <div className="page-container">

      <PageHeader
        eyebrow="Garage Management"
        title="Vehicles"
        subtitle="Manage customer vehicles and vehicle information."
      >
        <div className="page-header-actions">
          {can(user?.role, "vehicles.manage") && (
            <button
              className="secondary-button icon-only"
              onClick={fetchVehicles}
              title="Refresh vehicles"
              aria-label="Refresh vehicles"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {can(user?.role, "vehicles.manage") && (
            <button className="primary-button" onClick={openAddModal}>
              <Plus size={18} />
              Add Vehicle
            </button>
          )}
        </div>
      </PageHeader>

      {error && <ErrorMessage message={error} onRetry={fetchVehicles} />}

      <div className="table-card">

        <div className="table-toolbar">

          <div className="table-controls">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by vehicle, plate or customer..."
            />

            <label className="filter-select">
              <Filter size={15} />
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                aria-label="Filter by make"
              >
                <option value="all">All makes</option>
                {makes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="record-count">
            {filteredVehicles.length} vehicles
          </div>

        </div>

        {loading ? (
          <LoadingState label="Loading vehicles..." />
        ) : filteredVehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles found"
            hint="Add a vehicle to start managing your garage records."
            action={
              can(user?.role, "vehicles.manage") ? (
                <button className="primary-button" onClick={openAddModal}>
                  <Plus size={17} />
                  Add Vehicle
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>License Plate</th>
                  <th>Year</th>
                  <th>Mileage</th>
                  <th>Color</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id}>

                    <td data-label="Vehicle">
                      <div className="vehicle-info">

                        <Avatar
                          name={`${vehicle.make || ""} ${vehicle.model || ""}`}
                          icon={Car}
                          size={38}
                        />

                        <div>
                          <strong>
                            {vehicle.make} {vehicle.model}
                          </strong>

                          <span>ID: {vehicle._id.slice(-6)}</span>
                        </div>

                      </div>
                    </td>

                    <td data-label="Customer">
                      <div className="vehicle-customer">
                        <User size={15} />
                        {vehicle.customer?.name || "—"}
                      </div>
                    </td>

                    <td data-label="License Plate">
                      <span className="plate-badge">
                        {vehicle.licensePlate}
                      </span>
                    </td>

                    <td data-label="Year">{vehicle.year || "—"}</td>

                    <td data-label="Mileage">
                      {Number(vehicle.mileage || 0).toLocaleString()} km
                    </td>

                    <td data-label="Color">{vehicle.color || "—"}</td>

                    <td data-label="Actions">
                      <div className="action-buttons">

                        {can(user?.role, "vehicles.manage") && (
                          <button
                            className="icon-button edit"
                            title="Edit vehicle"
                            onClick={() => openEditModal(vehicle)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        {can(user?.role, "vehicles.delete") && (
                          <button
                            className="icon-button delete"
                            title="Delete vehicle"
                            onClick={() => setConfirmDelete(vehicle._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>

                <p>
                  {editingVehicle
                    ? "Update vehicle information"
                    : "Enter the vehicle details below"}
                </p>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <X size={19} />
              </button>

            </div>

            <form className="customer-form" onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Customer</label>

                <select
                  name="customer"
                  value={form.customer}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select customer</option>

                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} — {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">

                <div className="form-group">
                  <label>Make</label>

                  <input
                    name="make"
                    value={form.make}
                    onChange={handleChange}
                    placeholder="Toyota"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Model</label>

                  <input
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="Corolla"
                    required
                  />
                </div>

              </div>

              <div className="form-grid">

                <div className="form-group">
                  <label>Year</label>

                  <input
                    type="number"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    placeholder="2020"
                    min="1900"
                    max="2100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mileage</label>

                  <input
                    type="number"
                    name="mileage"
                    value={form.mileage}
                    onChange={handleChange}
                    placeholder="45000"
                    min="0"
                  />
                </div>

              </div>

              <div className="form-group">
                <label>License Plate</label>

                <input
                  name="licensePlate"
                  value={form.licensePlate}
                  onChange={handleChange}
                  placeholder="DD-12345"
                  required
                />
              </div>

              <div className="form-grid">

                <div className="form-group">
                  <label>VIN</label>

                  <input
                    name="vin"
                    value={form.vin}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>

                  <input
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    placeholder="White"
                  />
                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  {editingVehicle
                    ? "Update Vehicle"
                    : "Create Vehicle"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {can(user?.role, "vehicles.delete") && (
        <ConfirmDialog
          open={Boolean(confirmDelete)}
          title="Delete vehicle?"
          message="This will permanently delete this vehicle. This action cannot be undone."
          confirmLabel="Delete Vehicle"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

    </div>
  );
};

export default Vehicles;