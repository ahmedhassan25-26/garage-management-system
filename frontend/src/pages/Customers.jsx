import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Users, Mail, MapPin, AlertTriangle, Search, UserPlus } from "lucide-react";

import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import Avatar from "../components/Avatar";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import SearchBar from "../components/SearchBar";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const Customers = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");

      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, form);

        toast.success("Customer updated successfully.");
      } else {
        await api.post("/customers", form);

        toast.success("Customer created successfully.");
      }

      closeModal();
      await fetchCustomers();
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    try {
      setError("");

      await api.delete(`/customers/${customer._id}`);

      toast.success("Customer deleted successfully.");
      await fetchCustomers();
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message || "Failed to delete customer");
    }
  };

  const query = search.trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) => {
    if (!query) return true;

    return [customer.name, customer.phone, customer.email, customer.address]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const stats = [
    {
      label: "Total Customers",
      value: customers.length,
      icon: Users,
      tone: "blue",
    },
    {
      label: "With Email",
      value: customers.filter((customer) => customer.email).length,
      icon: Mail,
      tone: "green",
    },
    {
      label: "With Address",
      value: customers.filter((customer) => customer.address).length,
      icon: MapPin,
      tone: "orange",
    },
    {
      label: "Incomplete Contact",
      value: customers.filter((customer) => !customer.email || !customer.address).length,
      icon: AlertTriangle,
      tone: "red",
    },
  ];

  return (
    <div className="page-container">

      <PageHeader
        eyebrow="Garage Management"
        title="Customers"
        subtitle="Manage customer records, contact details and service history."
      >
        {can(user?.role, "customers.manage") && (
          <button className="primary-button" onClick={openAddModal}>
            <Plus size={18} />
            Add Customer
          </button>
        )}
      </PageHeader>

      {error && <ErrorMessage message={error} onRetry={fetchCustomers} />}

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

      <div className="table-card">

        <div className="table-toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone, email or address..."
          />

          <div className="record-count">
            {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading customers..." />
        ) : filteredCustomers.length === 0 ? (
          customers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No customers yet"
              hint="Add your first customer to start building your garage directory."
              action={
                <button className="primary-button" onClick={openAddModal}>
                  <Plus size={17} />
                  Add Customer
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matching customers"
              hint="Try a different search term or clear the search to see all customers."
              action={
                <button className="secondary-button" onClick={() => setSearch("")}>
                  Clear Search
                </button>
              }
            />
          )
        ) : (
          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id}>

                    <td data-label="Customer">
                      <div className="customer-cell">

                        <Avatar name={customer.name} size={38} />

                        <div>
                          <strong>{customer.name}</strong>
                          <span>ID: {customer._id.slice(-6)}</span>
                        </div>

                      </div>
                    </td>

                    <td data-label="Phone">
                      {customer.phone || <span className="text-muted">—</span>}
                    </td>

                    <td data-label="Email">
                      {customer.email ? (
                        <a
                          className="link-button"
                          href={`mailto:${customer.email}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail size={14} />
                          {customer.email}
                        </a>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </td>

                    <td data-label="Address">
                      {customer.address || <span className="text-muted">Not provided</span>}
                    </td>

                    <td data-label="Actions">
                      <div className="action-buttons">

                        {can(user?.role, "customers.manage") && (
                          <button
                            className="icon-button edit"
                            title="Edit customer"
                            onClick={() => openEditModal(customer)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        {can(user?.role, "customers.delete") && (
                          <button
                            className="icon-button delete"
                            title="Delete customer"
                            onClick={() => setConfirmDelete(customer)}
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
                <h2>{editingCustomer ? "Edit Customer" : "Add Customer"}</h2>

                <p>
                  {editingCustomer
                    ? "Update customer information"
                    : "Enter the customer details below"}
                </p>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <X size={19} />
              </button>

            </div>

            <form className="customer-form" onSubmit={handleSubmit}>

              <div className="form-grid">

                <div className="form-group">
                  <label htmlFor="customer-name">Full Name</label>

                  <input
                    id="customer-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Mohamed Ali"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customer-phone">Phone</label>

                  <input
                    id="customer-phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0912345678"
                    required
                  />
                </div>

              </div>

              <div className="form-grid">

                <div className="form-group">
                  <label htmlFor="customer-email">Email</label>

                  <input
                    id="customer-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="customer@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customer-address">Address</label>

                  <input
                    id="customer-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Customer address"
                  />
                </div>

              </div>

              <div className="form-group">
                <label htmlFor="customer-notes">Notes</label>

                <textarea
                  id="customer-notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about this customer"
                  rows="3"
                />
              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCustomer
                      ? "Update Customer"
                      : "Create Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {can(user?.role, "customers.delete") && (
        <ConfirmDialog
          open={Boolean(confirmDelete)}
          title={`Delete "${confirmDelete?.name || "customer"}"?`}
          message="This will permanently delete this customer and their records. This action cannot be undone."
          confirmLabel="Delete Customer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

    </div>
  );
};

export default Customers;