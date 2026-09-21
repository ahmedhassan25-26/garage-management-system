import { useCallback, useEffect, useState } from "react";
import "./JobCards.css";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { can } from "../utils/permissions";

const JobCards = () => {
  const [jobCards, setJobCards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmBox, setConfirmBox] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [spareParts, setSpareParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [partQuantity, setPartQuantity] = useState(1);
  const [addingPart, setAddingPart] = useState(false);


  const [form, setForm] = useState({
    customer: "",
    vehicle: "",
    assignedMechanic: "",
    complaint: "",
    diagnosis: "",
    estimatedCost: "",
    notes: "",
    services: [],
  });

  const [service, setService] = useState({
    description: "",
    cost: "",
  });

  const fetchJobCards = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/job-cards");

      setJobCards(response.data.jobCards || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load job cards"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get("/customers");

      setCustomers(
        response.data.customers || []
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await api.get("/vehicles");

      setVehicles(
        response.data.vehicles || []
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchMechanics = useCallback(async () => {
    try {
      const response = await api.get("/users/mechanics");

      setMechanics(
        response.data.mechanics || []
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchSpareParts = useCallback(async () => {
    try {
      const response = await api.get("/spare-parts");

      setSpareParts(
        response.data.spareParts || []
      );
    } catch (err) {
      console.error("Get spare parts error:", err);
    }
  }, []);

  useEffect(() => {
    const loadPageData = async () => {
      await Promise.all([
        fetchJobCards(),
        fetchCustomers(),
        fetchVehicles(),
        fetchMechanics(),
        fetchSpareParts(),
      ]);
    };

    void loadPageData();
  }, [
    fetchJobCards,
    fetchCustomers,
    fetchVehicles,
    fetchMechanics,
    fetchSpareParts,
  ]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const changeJobStatus = async (id, status) => {
    try {
      setError("");
      const res = await api.put(
        `/job-cards/${id}/status`,
        { status }
      );

      toast.success(
        status === "cancelled"
          ? "Job card cancelled."
          : status === "completed"
          ? "Job card marked as completed."
          : "Job card started."
      );

      await fetchJobCards();

      // If an invoice was created by the backend, navigate to invoices and pass the invoice id
      if (res.data?.invoice) {
        navigate("/invoices", {
          state: { invoiceId: res.data.invoice._id, invoiceNumber: res.data.invoice.invoiceNumber },
        });
      }
    } catch (err) {
      console.error("Change status error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to change status"
      );
    }
  };

  const openStatusConfirm = (id, status) => {
    const configs = {
      in_progress: {
        title: "Start this job?",
        message:
          "The job card will move to In Progress so a mechanic can begin work.",
        confirmLabel: "Start Job",
        danger: false,
      },
      completed: {
        title: "Mark job as completed?",
        message:
          "This will complete the job card and may generate the final invoice.",
        confirmLabel: "Complete Job",
        danger: false,
      },
      cancelled: {
        title: "Cancel this job?",
        message:
          "The job card will be marked as cancelled. This can affect billing.",
        confirmLabel: "Cancel Job",
        danger: true,
      },
    };

    const config = configs[status];

    setConfirmBox({
      type: "status",
      id,
      status,
      title: config.title,
      message: config.message,
      confirmLabel: config.confirmLabel,
      danger: config.danger,
    });
  };

  const openDeleteConfirm = (id) => {
    setConfirmBox({
      type: "delete",
      id,
    });
  };

  const handleConfirm = () => {
    if (!confirmBox) return;

    if (confirmBox.type === "delete") {
      void handleDelete(confirmBox.id);
    } else {
      void changeJobStatus(
        confirmBox.id,
        confirmBox.status
      );
    }

    setConfirmBox(null);
  };

    const addPartToJob = async () => {
    if (!editingJob) {
      setError("Save the job card first before adding spare parts.");
      return;
    }

    if (!selectedPart) {
      setError("Please select a spare part.");
      return;
    }

    if (Number(partQuantity) < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    const partDoc = spareParts.find(
      (p) => p._id === selectedPart
    );

    if (
      Number(partQuantity) >
      Number(partDoc?.quantity || 0)
    ) {
      setError(
        `Insufficient stock. Only ${partDoc?.quantity || 0} available for ${partDoc?.name || "this part"}.`
      );
      return;
    }

    try {
      setAddingPart(true);
      setError("");

      await api.post(
        `/job-cards/${editingJob._id}/parts`,
        {
          partId: selectedPart,
          quantity: Number(partQuantity),
        }
      );

      setSelectedPart("");
      setPartQuantity(1);

      await fetchJobCards();
      await fetchSpareParts();

      const response = await api.get(
        `/job-cards/${editingJob._id}`
      );

      setEditingJob(response.data.jobCard);

    } catch (err) {
      console.error("Add part error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to add spare part"
      );
    } finally {
      setAddingPart(false);
    }
  };


  const resetForm = () => {
    setForm({
      customer: "",
      vehicle: "",
      assignedMechanic: "",
      complaint: "",
      diagnosis: "",
      estimatedCost: "",
      notes: "",
      services: [],
    });

    setService({
      description: "",
      cost: "",
    });
  };

  const openAddModal = () => {
    setEditingJob(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);

    setForm({
      customer:
        job.customer?._id ||
        job.customer ||
        "",

      vehicle:
        job.vehicle?._id ||
        job.vehicle ||
        "",

      assignedMechanic:
        job.assignedMechanic?._id ||
        job.assignedMechanic ||
        "",

      complaint: job.complaint || "",
      diagnosis: job.diagnosis || "",
      estimatedCost:
        job.estimatedCost || "",
      notes: job.notes || "",
      services: job.services || [],
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingJob(null);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addService = () => {
    if (!service.description.trim()) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      services: [
        ...previous.services,
        {
          description:
            service.description.trim(),
          cost: Number(service.cost) || 0,
        },
      ],
    }));

    setService({
      description: "",
      cost: "",
    });
  };

  const removeService = (index) => {
    setForm((previous) => ({
      ...previous,
      services: previous.services.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const data = {
        customer: form.customer,
        vehicle: form.vehicle,
        assignedMechanic:
          form.assignedMechanic || undefined,

        complaint: form.complaint,
        diagnosis: form.diagnosis,

        services: form.services,

        estimatedCost:
          Number(form.estimatedCost) || 0,

        notes: form.notes,
      };

      if (editingJob) {
        await api.put(
          `/job-cards/${editingJob._id}`,
          data
        );
      } else {
        await api.post(
          "/job-cards",
          data
        );
      }

      closeModal();
      toast.success(
        editingJob
          ? "Job card updated successfully."
          : "Job card created successfully."
      );
      await fetchJobCards();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to save job card"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      setError("");

      await api.delete(`/job-cards/${id}`);

      toast.success("Job card deleted successfully.");
      await fetchJobCards();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to delete job card"
      );
    }
  };

  const filteredJobs = jobCards.filter(
    (job) => {
      const query = search.toLowerCase();

      return (
        job.customer?.name
          ?.toLowerCase()
          .includes(query) ||
        job.vehicle?.make
          ?.toLowerCase()
          .includes(query) ||
        job.vehicle?.model
          ?.toLowerCase()
          .includes(query) ||
        job.vehicle?.licensePlate
          ?.toLowerCase()
          .includes(query) ||
        job.complaint
          ?.toLowerCase()
          .includes(query) ||
        job.status
          ?.toLowerCase()
          .includes(query)
      );
    }
  );

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  const serviceTotal = form.services.reduce(
    (total, item) =>
      total + Number(item.cost || 0),
    0
  );

  const partsTotal = (editingJob?.partsUsed || []).reduce(
    (total, item) =>
      total + Number(item.totalPrice || 0),
    0
  );

  const grandTotal = serviceTotal + partsTotal;

  const selectedPartStock = Number(
    spareParts.find(
      (part) => part._id === selectedPart
    )?.quantity || 0
  );

  const canEditJob = (job) =>
    can(user?.role, "jobs.manage") &&
    (user?.role !== "mechanic" ||
      String(job.assignedMechanic?._id || job.assignedMechanic) === String(user?.id));

  const canChangeJobStatus = (job) =>
    can(user?.role, "jobs.status") &&
    (user?.role !== "mechanic" ||
      String(job.assignedMechanic?._id || job.assignedMechanic) === String(user?.id));

  const canAddPart =
    can(user?.role, "jobs.parts") &&
    (!editingJob ||
      user?.role !== "mechanic" ||
      String(editingJob.assignedMechanic?._id || editingJob.assignedMechanic) === String(user?.id));

  return (
   <div className="page-container job-cards-page">

      <PageHeader
        eyebrow="GARAGE OPERATIONS"
        title="Job Cards"
        subtitle="Manage vehicle service jobs."
      >
        {can(user?.role, "jobs.create") && (
          <button className="primary-button" onClick={openAddModal}>
            <Plus size={18} />
            New Job Card
          </button>
        )}
      </PageHeader>

      {error && (
        <div className="error-message">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <div className="job-summary-strip">
        <div>
          <strong>{jobCards.length}</strong>
          <span>Total Jobs</span>
        </div>

        <div>
          <strong>
            {jobCards.filter((j) => j.status === "pending").length}
          </strong>
          <span>Pending</span>
        </div>

        <div>
          <strong>
            {jobCards.filter((j) => j.status === "in_progress").length}
          </strong>
          <span>In Progress</span>
        </div>

        <div>
          <strong>
            {jobCards.filter((j) => j.status === "completed").length}
          </strong>
          <span>Completed</span>
        </div>
      </div>

      <div className="page-card">

        <div className="table-toolbar">

          <div className="search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search job cards..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="record-count">
            {filteredJobs.length} job cards
          </div>

        </div>

        {loading ? (
          <LoadingState label="Loading job cards..." />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No job cards found"
            hint="Create a job card to start managing a vehicle service."
            action={
              can(user?.role, "jobs.create") ? <button
                className="primary-button"
                onClick={openAddModal}
              >
                <Plus size={17} />
                New Job Card
              </button> : undefined
            }
          />
        ) : (
          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Complaint</th>
                  <th>Mechanic</th>
                  <th>Status</th>
                  <th>Estimated</th>
                  <th>Actual</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredJobs.map((job) => (
                  <tr key={job._id} className={Number(job.actualCost || 0) > Number(job.estimatedCost || 0) ? 'over-estimate' : ''}>

                    <td data-label="Customer">
                      <div className="customer-cell">

                        <Avatar
                          name={job.customer?.name || "Unassigned"}
                          size={36}
                        />

                        <div>
                          <strong>
                            {job.customer?.name ||
                              "—"}
                          </strong>

                          <span>
                            {job.customer?.phone ||
                              ""}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td data-label="Vehicle">
                      <strong>
                        {job.vehicle?.make}{" "}
                        {job.vehicle?.model}
                      </strong>

                      <div>
                        <span className="plate-badge">
                          {
                            job.vehicle
                              ?.licensePlate
                          }
                        </span>
                      </div>
                    </td>

                    <td data-label="Complaint">
                      <div className="complaint-cell">
                        {job.complaint}
                      </div>
                    </td>

                    <td data-label="Mechanic">
                      {job.assignedMechanic
                        ?.name || "Unassigned"}
                    </td>

                    <td data-label="Status">
                      <StatusBadge status={job.status} />
                    </td>

                    <td data-label="Estimated">
                      {formatCurrency(job.estimatedCost)}
                    </td>

                    <td data-label="Actual">
                      {formatCurrency(job.actualCost)}
                    </td>

                    <td data-label="Actions">

                      <div className="action-buttons">

                        {/* Edit/Delete disabled for locked/completed jobs */}
                        {canEditJob(job) && <button
                          className="icon-button edit"
                          title="Edit"
                          onClick={() => openEditModal(job)}
                          disabled={job.isLocked}
                        >
                          <Pencil size={16} />
                        </button>}

                        {can(user?.role, "jobs.delete") && <button
                          className="icon-button delete"
                          title="Delete"
                          onClick={() => openDeleteConfirm(job._id)}
                          disabled={job.isLocked}
                        >
                          <Trash2 size={16} />
                        </button>}

                        {/* Status actions for authorized roles */}
                        {canChangeJobStatus(job) && (
                          <>
                            {job.status === "pending" && (
                              <>
                                <button
                                  className="status-action"
                                  onClick={() => openStatusConfirm(job._id, "in_progress")}
                                >
                                  Start
                                </button>

                                <button
                                  className="status-action cancel"
                                  onClick={() => openStatusConfirm(job._id, "cancelled")}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {job.status === "in_progress" && (
                              <>
                                <button
                                  className="status-action complete"
                                  onClick={() => openStatusConfirm(job._id, "completed")}
                                >
                                  Complete
                                </button>

                                <button
                                  className="status-action cancel"
                                  onClick={() => openStatusConfirm(job._id, "cancelled")}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </>
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
        <div className="modal-overlay">

          <div className="modal job-modal">

            <div className="modal-header">

              <div>
                <h2>
                  {editingJob
                    ? "Edit Job Card"
                    : "New Job Card"}
                </h2>

                <p>
                  Create and manage a vehicle
                  service job
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="customer-form"
            >

              <div className="job-form-section">
                <h3>Customer &amp; Vehicle</h3>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Customer
                  </label>

                  <select
                    name="customer"
                    value={form.customer}
                    onChange={(e) => {
                      handleChange(e);

                      setForm((previous) => ({
                        ...previous,
                        vehicle: "",
                      }));
                    }}
                    required
                  >
                    <option value="">
                      Select customer
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={customer._id}
                          value={customer._id}
                        >
                          {customer.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Vehicle
                  </label>

                  <select
                    name="vehicle"
                    value={form.vehicle}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select vehicle
                    </option>

                    {vehicles
                      .filter(
                        (vehicle) =>
                          !form.customer ||
                          vehicle.customer?._id ===
                            form.customer
                      )
                      .map((vehicle) => (
                        <option
                          key={vehicle._id}
                          value={vehicle._id}
                        >
                          {vehicle.make}{" "}
                          {vehicle.model} —{" "}
                          {
                            vehicle.licensePlate
                          }
                        </option>
                      ))}

                  </select>

                </div>

              </div>

              <div className="form-group">

                <label>
                  Assign Mechanic
                </label>

                <select
                  name="assignedMechanic"
                  value={
                    form.assignedMechanic
                  }
                  onChange={handleChange}
                >
                  <option value="">
                    Unassigned
                  </option>

                  {mechanics.map(
                    (mechanic) => (
                      <option
                        key={mechanic._id}
                        value={mechanic._id}
                      >
                        {mechanic.name}
                      </option>
                    )
                  )}

                </select>

              </div>

              </div>

              <div className="job-form-section">
                <h3>Job Information</h3>

              <div className="form-group">

                <label>
                  Customer Complaint
                </label>

                <textarea
                  name="complaint"
                  value={form.complaint}
                  onChange={handleChange}
                  placeholder="Describe the customer's complaint..."
                  rows="3"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Diagnosis
                </label>

                <textarea
                  name="diagnosis"
                  value={form.diagnosis}
                  onChange={handleChange}
                  placeholder="Enter diagnosis if available..."
                  rows="3"
                />

              </div>

              </div>

              <div className="job-form-section">
                <h3>Services</h3>

              <div className="form-group">

                <label>
                  Services
                </label>

                <div className="service-input-row">

                  <input
                    value={
                      service.description
                    }
                    onChange={(e) =>
                      setService({
                        ...service,
                        description:
                          e.target.value,
                      })
                    }
                    placeholder="Service description"
                  />

                  <input
                    type="number"
                    value={service.cost}
                    onChange={(e) =>
                      setService({
                        ...service,
                        cost: e.target.value,
                      })
                    }
                    placeholder="Cost"
                    min="0"
                  />

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={addService}
                  >
                    <Plus size={16} />
                    Add
                  </button>

                </div>

                {form.services.length >
                  0 && (
                  <div className="service-list">

                    {form.services.map(
                      (item, index) => (
                        <div
                          className="service-item"
                          key={index}
                        >

                          <div>
                            <strong>
                              {
                                item.description
                              }
                            </strong>

                            <span>
                              $
                              {Number(
                                item.cost || 0
                              ).toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="remove-service"
                            onClick={() =>
                              removeService(
                                index
                              )
                            }
                          >
                            <X size={15} />
                          </button>

                        </div>
                      )
                    )}

                    <div className="service-total">
                      Service Total: $
                      {serviceTotal.toFixed(2)}
                    </div>

                  </div>
                )}

              </div>

              </div>

              <div className="job-form-section">
                <h3>Spare Parts</h3>

              {/* ================================
                  SPARE PARTS USED
              ================================= */}

              <div className="form-group">

                <label>
                  Spare Parts Used
                </label>

                {!editingJob ? (
                  <div className="info-message">
                    Create the job card first, then you can add spare parts.
                  </div>
                ) : !canAddPart ? (
                  <div className="info-message">
                    Spare parts can only be added by an authorized user for this job.
                  </div>
                ) : (
                  <>
                    <div className="service-input-row">

                      <select
                        value={selectedPart}
                        onChange={(e) =>
                          setSelectedPart(e.target.value)
                        }
                      >
                        <option value="">
                          Select spare part
                        </option>

                        {spareParts.map((part) => (
                          <option
                            key={part._id}
                            value={part._id}
                            disabled={Number(part.quantity) <= 0}
                          >
                            {part.name} — {part.partNumber} — Stock:{" "}
                            {part.quantity} — $
                            {Number(
                              part.sellingPrice || 0
                            ).toFixed(2)}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        max={selectedPartStock || undefined}
                        value={partQuantity}
                        onChange={(e) =>
                          setPartQuantity(e.target.value)
                        }
                        placeholder="Qty"
                      />

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={addPartToJob}
                        disabled={addingPart}
                      >
                        {addingPart
                          ? "Adding..."
                          : "Add Part"}
                      </button>

                    </div>

                    {editingJob.partsUsed?.length > 0 && (
                      <div className="service-list">

                        {editingJob.partsUsed.map(
                          (item, index) => (
                            <div
                              className="service-item"
                              key={item._id || index}
                            >

                              <div>
                                <strong>
                                  {item.part?.name ||
                                    "Spare Part"}
                                </strong>

                                <span>
                                  {item.quantity} × $
                                  {Number(
                                    item.unitPrice || 0
                                  ).toFixed(2)}
                                  {" = "}
                                  $
                                  {Number(
                                    item.totalPrice || 0
                                  ).toFixed(2)}
                                </span>
                              </div>

                            </div>
                          )
                        )}

                        <div className="service-total">
                          Parts Total: $
                          {editingJob.partsUsed
                            .reduce(
                              (total, item) =>
                                total +
                                Number(
                                  item.totalPrice || 0
                                ),
                              0
                            )
                            .toFixed(2)}
                        </div>

                      </div>
                    )}

                  </>
                )}

              </div>

              </div>

              <div className="job-form-section">
                <h3>Cost Summary</h3>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Estimated Cost
                  </label>

                  <input
                    type="number"
                    name="estimatedCost"
                    value={
                      form.estimatedCost
                    }
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />

                </div>

                {editingJob && (
                  <div className="form-group">

                    <label>
                      Actual Cost
                    </label>

                    <input
                      type="text"
                      value={'$' + Number(editingJob.actualCost || 0).toFixed(2)}
                      readOnly
                    />

                  </div>
                )}

                <div className="form-group">

                  <label>
                    Notes
                  </label>

                  <input
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Optional notes"
                  />

                </div>

              </div>

              <div className="job-cost-summary">
                <div>
                  <span>Service Total</span>
                  <strong>
                    ${serviceTotal.toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>Parts Total</span>
                  <strong>${partsTotal.toFixed(2)}</strong>
                </div>

                {editingJob && (
                  <div>
                    <span>Estimated Cost</span>
                    <strong>
                      $
                      {Number(
                        editingJob.estimatedCost || 0
                      ).toFixed(2)}
                    </strong>
                  </div>
                )}

                {editingJob && (
                  <div>
                    <span>Actual Cost (system)</span>
                    <strong>
                      $
                      {Number(
                        editingJob.actualCost || 0
                      ).toFixed(2)}
                    </strong>
                  </div>
                )}

                <div className="job-cost-grand">
                  <span>Grand Total</span>
                  <strong>${grandTotal.toFixed(2)}</strong>
                </div>
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

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingJob
                    ? "Update Job Card"
                    : "Create Job Card"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmBox)}
        title={
          confirmBox?.title ||
          "Delete job card?"
        }
        message={
          confirmBox?.type === "delete"
            ? "This will permanently delete this job card. This action cannot be undone."
            : confirmBox?.message
        }
        confirmLabel={
          confirmBox?.type === "delete"
            ? "Delete Job Card"
            : confirmBox?.confirmLabel
        }
        danger={
          confirmBox?.type === "delete"
            ? true
            : confirmBox?.danger
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmBox(null)}
      />

    </div>
  );
};

export default JobCards;
