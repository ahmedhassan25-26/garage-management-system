import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Filter,
  Package,
  PackagePlus,
  PackageX,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";
import "./SpareParts.css";

const emptyForm = {
  name: "",
  partNumber: "",
  category: "",
  quantity: 0,
  minimumStock: 5,
  purchasePrice: 0,
  sellingPrice: 0,
  supplier: "",
  location: "",
  description: "",
};

const SpareParts = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [restockPart, setRestockPart] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [restockReason, setRestockReason] = useState("");
  const [restocking, setRestocking] = useState(false);
  const [restockError, setRestockError] = useState("");

  const fetchParts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/spare-parts");

      setParts(response.data.spareParts || []);
    } catch (err) {
      console.error("Get spare parts error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load spare parts"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingPart(null);
    setForm(emptyForm);
    setError("");
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (part) => {
    setEditingPart(part);

    setForm({
      name: part.name || "",
      partNumber: part.partNumber || "",
      category: part.category || "",
      quantity: part.quantity ?? 0,
      minimumStock: part.minimumStock ?? 5,
      purchasePrice: part.purchasePrice ?? 0,
      sellingPrice: part.sellingPrice ?? 0,
      supplier: part.supplier || "",
      location: part.location || "",
      description: part.description || "",
    });

    setError("");
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingPart(null);
    setForm(emptyForm);
    setFormError("");
  };

  const validateForm = () => {
    if (Number(form.quantity) < 0) {
      return "Quantity cannot be negative.";
    }

    if (Number(form.minimumStock) < 0) {
      return "Minimum stock cannot be negative.";
    }

    if (
      Number(form.purchasePrice) < 0 ||
      Number(form.sellingPrice) < 0
    ) {
      return "Prices cannot be negative.";
    }

    if (
      Number(form.sellingPrice) <
      Number(form.purchasePrice)
    ) {
      return "Selling price cannot be lower than the purchase price.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setFormError("");

      const payload = {
        ...form,
        quantity: Number(form.quantity),
        minimumStock: Number(form.minimumStock),
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
      };

      if (editingPart) {
        await api.put(
          `/spare-parts/${editingPart._id}`,
          payload
        );

        toast.success("Spare part updated successfully.");
      } else {
        await api.post(
          "/spare-parts",
          payload
        );

        toast.success("Spare part created successfully.");
      }

      await fetchParts();

      setShowForm(false);
      setEditingPart(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("Save spare part error:", err);

      toast.error(
        err.response?.data?.message ||
          "Failed to save spare part"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      setError("");

      await api.delete(
        `/spare-parts/${confirmDelete._id}`
      );

      toast.success("Spare part deleted successfully.");
      setConfirmDelete(null);

      await fetchParts();
    } catch (err) {
      console.error("Delete spare part error:", err);

      toast.error(
        err.response?.data?.message ||
          "Failed to delete spare part"
      );
    }
  };

  const openRestock = (part) => {
    setRestockPart(part);
    setRestockQuantity("");
    setRestockReason("");
    setRestockError("");
  };

  const closeRestock = () => {
    if (restocking) return;

    setRestockPart(null);
    setRestockQuantity("");
    setRestockReason("");
    setRestockError("");
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();

    if (restocking || !restockPart) return;

    const quantity = Number(restockQuantity);

    if (
      !restockQuantity ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setRestockError(
        "Quantity must be a positive number."
      );
      return;
    }

    try {
      setRestocking(true);
      setRestockError("");

      await api.post(
        `/spare-parts/${restockPart._id}/restock`,
        {
          quantity,
          reason: restockReason.trim() || undefined,
        }
      );

      toast.success(
        "Spare part restocked successfully."
      );

      setRestockPart(null);
      setRestockQuantity("");
      setRestockReason("");

      await fetchParts();
    } catch (err) {
      console.error("Restock spare part error:", err);

      setRestockError(
        err.response?.data?.message ||
          "Failed to restock spare part"
      );
    } finally {
      setRestocking(false);
    }
  };

  const isLowStock = (part) => {
    return (
      Number(part.quantity) <=
      Number(part.minimumStock)
    );
  };

  const isOutOfStock = (part) => {
    return Number(part.quantity) <= 0;
  };

  const stockLevel = (part) => {
    if (isOutOfStock(part)) return "out";
    if (isLowStock(part)) return "low";
    return "in";
  };

  const categories = [
    ...new Set(
      parts
        .map((part) => part.category)
        .filter(Boolean)
        .sort()
    ),
  ];

  const stats = [
    {
      label: "Total Parts",
      value: parts.length,
      icon: Package,
      tone: "blue",
    },
    {
      label: "Total Quantity",
      value: parts.reduce(
        (total, part) =>
          total + Number(part.quantity || 0),
        0
      ),
      icon: Boxes,
      tone: "green",
    },
    {
      label: "Low Stock",
      value: parts.filter(isLowStock).length,
      icon: AlertTriangle,
      tone: "orange",
    },
    {
      label: "Out of Stock",
      value: parts.filter(isOutOfStock).length,
      icon: PackageX,
      tone: "red",
    },
    {
      label: "Inventory Value",
      value: `$${parts
        .reduce(
          (total, part) =>
            total +
            Number(part.quantity || 0) *
              Number(part.purchasePrice || 0),
          0
        )
        .toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}`,
      icon: DollarSign,
      tone: "emerald",
    },
  ];

  const visibleParts = parts.filter((part) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [part.name, part.partNumber, part.category, part.supplier, part.location]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
    const matchesCategory =
      categoryFilter === "all" ||
      part.category === categoryFilter;
    const matchesStock =
      stockFilter === "all" ||
      stockLevel(part) === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="page-container spare-parts-page">
      <PageHeader
        eyebrow="Garage Operations"
        title="Spare Parts"
        subtitle="Manage garage inventory and spare parts."
      >
        {can(user?.role, "inventory.manage") && (
          <button className="primary-button" onClick={openCreateForm}>
            <Plus size={17} /> Add Spare Part
          </button>
        )}
      </PageHeader>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            tone={stat.tone}
          />
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>{editingPart ? "Edit Spare Part" : "Add Spare Part"}</h2>

          {formError && (
            <div className="error-message">
              <AlertTriangle size={15} />
              {formError}
            </div>
          )}

          <fieldset className="form-section">
            <legend>Identification</legend>

            <div className="form-grid">
              <div className="form-group">
                <label>Part Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Brake Pad Set"
                  required
                />
              </div>

              <div className="form-group">
                <label>Part Number</label>
                <input
                  name="partNumber"
                  value={form.partNumber}
                  onChange={handleChange}
                  placeholder="e.g. BP-2024"
                  required
                  disabled={!!editingPart}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Brakes"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Stock Levels</legend>

            <div className="form-grid">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Minimum Stock</label>
                <input
                  name="minimumStock"
                  type="number"
                  min="0"
                  value={form.minimumStock}
                  onChange={handleChange}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Pricing</legend>

            <div className="form-grid">
              <div className="form-group">
                <label>Purchase Price</label>
                <div className="input-prefix">
                  <DollarSign size={15} />
                  <input
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Selling Price</label>
                <div className="input-prefix">
                  <DollarSign size={15} />
                  <input
                    name="sellingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Supplier & Location</legend>

            <div className="form-grid">
              <div className="form-group">
                <label>Supplier</label>
                <input
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  placeholder="e.g. AutoZone"
                />
              </div>

              <div className="form-group">
                <label>Storage Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Shelf B3"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Additional Notes</legend>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Optional description of this part"
                />
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : editingPart ? "Update Part" : "Create Part"}
            </button>

            <button type="button" className="secondary-button" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        <div className="table-header">
          <div><h2>Inventory List</h2><span className="table-caption">{visibleParts.length} of {parts.length} parts shown</span></div>
          <div className="table-controls">
            <div className="search-box compact-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search parts..." aria-label="Search spare parts" />{search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}</div>
            <label className="filter-select"><Filter size={15} /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="filter-select"><Filter size={15} /><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} aria-label="Filter stock"><option value="all">All stock</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></label>
            <button className="secondary-button icon-only" onClick={fetchParts} disabled={loading} title="Refresh inventory"><RefreshCw size={16} className={loading ? "spin" : ""} /></button>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading spare parts..." />
        ) : visibleParts.length === 0 ? (
          <EmptyState
            icon={Package}
            title={parts.length ? "No matching parts" : "No spare parts found"}
            hint={parts.length ? "Try adjusting the search or filters." : "Add spare parts to keep your inventory tracker."}
            action={
              !parts.length ? (
                can(user?.role, "inventory.manage") ? <button
                  className="primary-button"
                  onClick={openCreateForm}
                >
                  <Plus size={17} />
                  Add Spare Part
                </button> : undefined
              ) : undefined
            }
          />
        ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Part Number</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Min. Stock</th>
                <th>Purchase</th>
                <th>Selling</th>
                <th>Supplier</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleParts.map((part) => (
                  <tr key={part._id}>
                    <td data-label="Name">{part.name}</td>
                    <td data-label="Part Number">{part.partNumber}</td>
                    <td data-label="Category">{part.category || "-"}</td>
                    <td data-label="Quantity">
                      <span
                        className={`status-badge ${
                          stockLevel(part) === "in"
                            ? "good"
                            : stockLevel(part) === "low"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {stockLevel(part) === "in"
                          ? "In stock"
                          : stockLevel(part) === "low"
                          ? "Low stock"
                          : "Out of stock"}
                      </span>
                      <div className="stock-qty">
                        Qty: {part.quantity}
                      </div>
                    </td>
                    <td data-label="Min. Stock">{part.minimumStock}</td>
                    <td data-label="Purchase">${Number(part.purchasePrice || 0).toFixed(2)}</td>
                    <td data-label="Selling">${Number(part.sellingPrice || 0).toFixed(2)}</td>
                    <td data-label="Supplier">{part.supplier || "-"}</td>
                    <td data-label="Location">{part.location || "-"}</td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        {can(user?.role, "inventory.manage") && <button className="icon-button restock" title="Restock part" onClick={() => openRestock(part)}>
                          <PackagePlus size={15} />
                        </button>}
                        {can(user?.role, "inventory.manage") && <button className="icon-button edit" title="Edit part" onClick={() => openEditForm(part)}>
                          <Pencil size={15} />
                        </button>}
                        {can(user?.role, "inventory.manage") && <button className="icon-button delete" title="Delete part" onClick={() => setConfirmDelete(part)}>
                          <Trash2 size={15} />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {can(user?.role, "inventory.manage") && <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={`Delete "${confirmDelete?.name || "part"}"?`}
        message="This will permanently delete this spare part from inventory. This action cannot be undone."
        confirmLabel="Delete Part"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />}

      {restockPart && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Restock Spare Part</h2>
                <p>{restockPart.name} &middot; Current quantity: {restockPart.quantity}</p>
              </div>
              <button
                className="modal-close"
                onClick={closeRestock}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="modal-body">
              {restockError && (
                <div className="error-message">
                  <AlertTriangle size={15} />
                  {restockError}
                </div>
              )}

              <div className="form-group">
                <label>Quantity to add</label>
                <input
                  name="restockQuantity"
                  type="number"
                  min="1"
                  step="1"
                  value={restockQuantity}
                  onChange={(event) => setRestockQuantity(event.target.value)}
                  placeholder="e.g. 10"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason (optional)</label>
                <input
                  name="restockReason"
                  value={restockReason}
                  onChange={(event) => setRestockReason(event.target.value)}
                  placeholder="e.g. New shipment from supplier"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={restocking}
                >
                  {restocking ? "Restocking..." : "Restock"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeRestock}
                  disabled={restocking}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpareParts;
