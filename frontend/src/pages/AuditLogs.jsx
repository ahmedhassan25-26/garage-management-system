import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import Avatar from "../components/Avatar";
import "./AuditLogs.css";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/audit-logs");
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error("Get audit logs error:", error);
      setError(error.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const modules = [
    ...new Set(logs.map((log) => log.module).filter(Boolean).sort()),
  ];

  const visibleLogs = logs.filter((log) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [log.user?.name, log.user?.email, log.action, log.module, log.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));

    const matchesModule =
      moduleFilter === "all" || log.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="page-container audit-logs-page">
      <PageHeader
        eyebrow="SYSTEM AUDIT"
        title="Audit Logs"
        subtitle="Track important activities performed in the system."
      >
        <button className="secondary-button" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </PageHeader>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h2>System Activity</h2>
            <span className="table-caption">
              {visibleLogs.length} of {logs.length} activities
            </span>
          </div>

          <div className="table-controls">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search activity..."
            />

            <label className="filter-select">
              <span>Module</span>
              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                aria-label="Filter by module"
              >
                <option value="all">All modules</option>
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchLogs} />}

        {loading ? (
          <LoadingState label="Loading audit logs..." />
        ) : visibleLogs.length === 0 ? (
          <EmptyState
            title={logs.length ? "No matching activity" : "No audit logs found"}
            hint={
              logs.length
                ? "Try a different search term or module."
                : "System activities will appear here."
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>IP Address</th>
                </tr>
              </thead>

              <tbody>
                {visibleLogs.map((log) => (
                  <tr key={log._id}>
                    <td data-label="Date">{formatDate(log.createdAt)}</td>

                    <td data-label="User">
                      <div className="user-cell">
                        <Avatar name={log.user?.name || "Unknown"} size={36} />
                        <div>
                          <strong>{log.user?.name || "Unknown"}</strong>
                          <span>{log.user?.email || ""}</span>
                        </div>
                      </div>
                    </td>

                    <td data-label="Action">
                      <span className="action-badge">{log.action}</span>
                    </td>

                    <td data-label="Module">{log.module}</td>
                    <td data-label="Description">{log.description}</td>
                    <td data-label="IP Address">{log.ipAddress || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;