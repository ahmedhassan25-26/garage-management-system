import { useEffect, useState } from "react";
import {
  RefreshCw,
  Pencil,
  Trash2,
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Wrench,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SearchBar from "../components/SearchBar";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import ErrorMessage from "../components/ErrorMessage";
import Avatar from "../components/Avatar";
import { useToast } from "../context/ToastContext";
import "./Users.css";

const ROLES = ["admin", "manager", "receptionist", "mechanic"];

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist",
  });

  const [confirm, setConfirm] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/users");
      setUsers(response.data.users || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "receptionist",
    });
  };

  const openAddModal = () => {
    setEditingUser(null);
    resetForm();
    setError("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    if (!editingUser && form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, data);
      } else {
        await api.post("/users", data);
      }

      closeModal();
      toast.success(
        editingUser
          ? "User updated successfully."
          : "User created successfully."
      );
      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to save user"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    if (user._id === currentUser?.id) {
      toast.error("You cannot change your own account status.");
      return;
    }

    setConfirm({
      type: "toggle",
      user,
      title: user.isActive ? "Deactivate this user?" : "Activate this user?",
      message: user.isActive
        ? `${user.name} will no longer be able to sign in. Existing sessions stay valid until their token expires.`
        : `${user.name} will be able to sign in again.`,
      confirmLabel: user.isActive ? "Deactivate" : "Activate",
      danger: user.isActive,
    });
  };

  const openDeleteConfirm = (user) => {
    if (user._id === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }

    setConfirm({
      type: "delete",
      user,
      title: "Delete this user?",
      message: `This will permanently remove ${user.name}. This action cannot be undone.`,
      confirmLabel: "Delete User",
      danger: true,
    });
  };

  const handleConfirm = async () => {
    if (!confirm) return;

    try {
      setSaving(true);
      setError("");

      const { type, user } = confirm;

      if (type === "delete") {
        await api.delete(`/users/${user._id}`);
        toast.success("User deleted successfully.");
      } else {
        await api.put(`/users/${user._id}`, {
          isActive: !user.isActive,
        });
        toast.success(
          user.isActive
            ? "User deactivated."
            : "User activated."
        );
      }

      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Action failed"
      );
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const query = search.trim().toLowerCase();

  const visibleUsers = users.filter((u) => {
    const matchesSearch =
      !query ||
      [u.name, u.email, u.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));

    const matchesRole =
      roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="page-container users-page">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Users"
        subtitle="Manage system users, roles and account access."
      >
        <button
          className="secondary-button"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>

        <button className="primary-button" onClick={openAddModal}>
          <UserPlus size={17} />
          Add User
        </button>
      </PageHeader>

      <div className="stats-grid">
        <StatCard
          label="Total Users"
          value={users.length}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Active Accounts"
          value={activeCount}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Administrators"
          value={adminCount}
          icon={Wrench}
          tone="purple"
        />
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={fetchUsers} />
      )}

      <div className="table-card">
        <div className="table-header">
          <div>
            <h2>Team Members</h2>
            <span className="table-caption">
              {visibleUsers.length} of {users.length} users shown
            </span>
          </div>

          <div className="table-controls">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
            />

            <label className="filter-select">
              <span>Role</span>
              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                aria-label="Filter by role"
              >
                <option value="all">All roles</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading users..." />
        ) : visibleUsers.length === 0 ? (
          <EmptyState
            icon={users.length ? undefined : UserPlus}
            title={
              users.length
                ? "No matching users found"
                : "No users yet"
            }
            hint={
              users.length
                ? "Try a different search term or role."
                : "Add your first user to get started."
            }
            action={
              !users.length ? (
                <button
                  className="primary-button"
                  onClick={openAddModal}
                >
                  <UserPlus size={17} />
                  Add User
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleUsers.map((user) => {
                  const isSelf = user._id === currentUser?.id;

                  return (
                    <tr key={user._id}>
                      <td data-label="Name">
                        <div className="user-cell">
                          <Avatar name={user.name} size={36} />
                          <div>
                            <strong>{user.name}</strong>
                            {isSelf && (
                              <span className="users-self-tag">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td data-label="Email">{user.email}</td>

                      <td data-label="Role">
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>

                      <td data-label="Status">
                        <StatusBadge status={user.isActive ? "active" : "inactive"} />
                      </td>

                      <td data-label="Created">{formatDate(user.createdAt)}</td>

                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button
                            className="icon-button edit"
                            title="Edit user"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => openEditModal(user)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className={`icon-button ${
                              user.isActive ? "toggle" : "toggle-off"
                            }`}
                            title={
                              user.isActive
                                ? "Deactivate user"
                                : "Activate user"
                            }
                            aria-label={
                              user.isActive
                                ? `Deactivate ${user.name}`
                                : `Activate ${user.name}`
                            }
                            onClick={() => toggleActive(user)}
                            disabled={isSelf}
                          >
                            {user.isActive ? (
                              <UserCheck size={16} />
                            ) : (
                              <UserX size={16} />
                            )}
                          </button>

                          <button
                            className="icon-button delete"
                            title="Delete user"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => openDeleteConfirm(user)}
                            disabled={isSelf}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal user-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingUser ? "Edit User" : "Add User"}
                </h2>
                <p>
                  {editingUser
                    ? "Update the user's details and role."
                    : "Create a new system user."}
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

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="user-name">Full name</label>
                  <input
                    id="user-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-email">Email</label>
                  <input
                    id="user-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-role">Role</label>
                  <select
                    id="user-role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="user-password">
                    {editingUser
                      ? "Password (leave blank to keep)"
                      : "Password"}
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={
                      editingUser
                        ? "Optional — new password"
                        : "Minimum 6 characters"
                    }
                    minLength={editingUser ? undefined : 6}
                  />
                </div>
              </div>

              <div className="form-actions">
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
                    : editingUser
                    ? "Update User"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
        confirmDisabled={saving}
      />
    </div>
  );
};

export default UsersPage;