import { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  Car,
  ClipboardList,
  Package,
  FileText,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Wrench,
  RefreshCw,
  ArrowRight,
  PlusCircle,
  FilePlus,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard");

      setDashboard(response.data.dashboard);

      try {
        const [jobsRes, invoicesRes, paymentsRes] = await Promise.all([
          api.get("/job-cards"),
          api.get("/invoices"),
          api.get("/payments"),
        ]);

        setRecentJobs((jobsRes.data.jobCards || []).slice(0, 5));
        setRecentInvoices((invoicesRes.data.invoices || []).slice(0, 5));
        setRecentPayments((paymentsRes.data.payments || []).slice(0, 5));
      } catch {
        // Non-critical recent lists; dashboard still renders without them.
      }
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton-banner" />
        <div className="skeleton-stats">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="skeleton-stat" key={i}>
              <Skeleton circle height={42} width={42} />
              <Skeleton height={12} width="55%" />
              <Skeleton height={18} width="75%" />
            </div>
          ))}
        </div>
        <div className="skeleton-main-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="state">
          <AlertTriangle size={36} color="var(--primary)" />
          <h3 className="dash-error-heading">Dashboard unavailable</h3>
          <p style={{ margin: 0 }}>{error}</p>

          <button className="primary-button" onClick={fetchDashboard}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const jobChartData = [
    { name: "Pending", value: dashboard.jobs.pending },
    { name: "Active", value: dashboard.jobs.active },
    { name: "Completed", value: dashboard.jobs.completed },
  ];

  const revenueChartData = (dashboard.financial.recentRevenue || []).map(
    (r) => ({
      name: new Date(r.date).toLocaleDateString(undefined, {
        weekday: "short",
      }),
      value: Number(r.total) || 0,
    })
  );

  const statCards = [
    {
      title: "Customers",
      value: dashboard.customers,
      icon: Users,
      className: "blue",
      to: "/customers",
    },
    {
      title: "Vehicles",
      value: dashboard.vehicles,
      icon: Car,
      className: "purple",
      to: "/vehicles",
    },
    {
      title: "Job Cards",
      value: dashboard.jobs.total,
      icon: ClipboardList,
      className: "orange",
      to: "/job-cards",
    },
    {
      title: "Spare Parts",
      value: dashboard.inventory.totalParts,
      icon: Package,
      className: "green",
      to: "/spare-parts",
    },
    {
      title: "Invoices",
      value: dashboard.invoices.total,
      icon: FileText,
      className: "cyan",
      to: "/invoices",
    },
    {
      title: "Total Revenue",
      value: `$${dashboard.financial.totalRevenue}`,
      icon: TrendingUp,
      className: "emerald",
      to: "/payments",
    },
  ];

  const quickActions = [
    { label: "Add Customer", icon: PlusCircle, to: "/customers" },
    { label: "New Job Card", icon: FilePlus, to: "/job-cards" },
    { label: "Record Payment", icon: Wallet, to: "/payments" },
  ];

  return (
    <div className="page-container">
      {/* Welcome banner */}
      <section className="dash-welcome">
        <div>
          <p className="dash-welcome-eyebrow">
            WORKSHOP OVERVIEW
          </p>
          <h1>
            Welcome back,{" "}
            <span>{user?.name?.split(" ")[0] || "User"}</span>
          </h1>
          <p className="dash-welcome-sub">
            Here's what's happening across your garage today.
          </p>

          <div className="dash-quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  className="dash-quick-action"
                  onClick={() => navigate(action.to)}
                  disabled={action.to === "/payments" && !["admin", "manager", "receptionist"].includes(user?.role)}
                >
                  <Icon size={16} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="refresh-button"
          onClick={fetchDashboard}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </section>

      {/* Statistics */}
      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              className="stat-card dash-stat-card"
              key={card.title}
              onClick={() => navigate(card.to)}
            >
              <div className={`stat-card-icon ${card.className}`}>
                <Icon size={20} />
              </div>

              <div className="stat-card-content">
                <span>{card.title}</span>
                <strong>{card.value}</strong>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* Job Status */}
        <section className="dashboard-card job-card">
          <div className="card-header">
            <div>
              <h2>Job Status</h2>
              <p>Current status of all job cards</p>
            </div>

            <ClipboardList size={21} />
          </div>

          <div className="chart-wrapper">
            {dashboard.jobs.total > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={jobChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#22c55e" />
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [`${value} jobs`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No job cards yet"
                hint="Create a job card to start tracking workshop work."
              />
            )}
          </div>

          <div className="job-summary">
            <div>
              <span>Pending</span>
              <strong>{dashboard.jobs.pending}</strong>
            </div>

            <div>
              <span>Active</span>
              <strong>{dashboard.jobs.active}</strong>
            </div>

            <div>
              <span>Completed</span>
              <strong>{dashboard.jobs.completed}</strong>
            </div>
          </div>
        </section>

        {/* Financial */}
        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Financial Overview</h2>
              <p>Current garage financial summary</p>
            </div>

            <CreditCard size={21} />
          </div>

          <div className="financial-list">
            <div className="financial-item">
              <div className="financial-icon revenue">
                <TrendingUp size={20} />
              </div>

              <div>
                <span>Total Revenue</span>
                <strong>${dashboard.financial.totalRevenue}</strong>
              </div>
            </div>

            <div className="financial-item">
              <div className="financial-icon pending">
                <Clock3 size={20} />
              </div>

              <div>
                <span>Pending Revenue</span>
                <strong>${dashboard.financial.pendingRevenue}</strong>
              </div>
            </div>

            <div className="financial-item">
              <div className="financial-icon invoice">
                <FileText size={20} />
              </div>

              <div>
                <span>Total Invoices</span>
                <strong>{dashboard.invoices.total}</strong>
              </div>
            </div>

            <div className="financial-item">
              <div className="financial-icon paid">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <span>Unpaid Invoices</span>
                <strong>{dashboard.invoices.unpaid}</strong>
              </div>
            </div>

            <div className="financial-item">
              <div className="financial-icon revenue">
                <TrendingUp size={20} />
              </div>

              <div>
                <span>Today's Revenue</span>
                <strong>${dashboard.financial.todayRevenue}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Revenue over time */}
      <section className="dashboard-card revenue-card">
        <div className="card-header">
          <div>
            <h2>Revenue (last 7 days)</h2>
            <p>Daily payments received</p>
          </div>

          <TrendingUp size={21} />
        </div>

        {revenueChartData.length > 0 ? (
          <div className="revenue-chart-box">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={revenueChartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#edf1f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                  dot={{ r: 3, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="revenue-chart-empty">No payment data available yet</div>
        )}
      </section>

      {/* Bottom cards */}
      <div className="bottom-grid">
        {/* Inventory */}
        <section className="dashboard-card small-card">
          <div className="card-header">
            <div>
              <h2>Inventory</h2>
              <p>Spare parts overview</p>
            </div>

            <Package size={21} />
          </div>

          <div className="inventory-number">
            {dashboard.inventory.totalParts}
          </div>

          <span className="inventory-label">Total spare parts</span>

          <div className={`stock-status ${dashboard.inventory.lowStock > 0 ? "warning" : "success"}`}>
            {dashboard.inventory.lowStock > 0 ? (
              <AlertTriangle size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}

            {dashboard.inventory.lowStock > 0
              ? `${dashboard.inventory.lowStock} item${dashboard.inventory.lowStock === 1 ? "" : "s"} low in stock`
              : "All stock levels are healthy"}
          </div>

          {dashboard.inventory.lowStockParts && dashboard.inventory.lowStockParts.length > 0 && (
            <div className="low-stock">
              <h4 className="low-stock-heading">Low Stock</h4>
              <ul className="low-stock-list">
                {dashboard.inventory.lowStockParts.map((p) => (
                  <li className="low-stock-item" key={p._id}>
                    <span>{p.name}</span>
                    <span>{p.quantity} left</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Team */}
        <section className="dashboard-card small-card">
          <div className="card-header">
            <div>
              <h2>Team</h2>
              <p>Garage staff</p>
            </div>

            <UserRound size={21} />
          </div>

          <div className="team-stats">
            <div>
              <strong>{dashboard.users.total}</strong>
              <span>Total Users</span>
            </div>

            <div>
              <strong>{dashboard.users.mechanics}</strong>
              <span>Mechanics</span>
            </div>
          </div>

          <div className="team-note">
            <Wrench size={16} />
            Garage team members
          </div>
        </section>

        {/* Jobs */}
        <section className="dashboard-card small-card">
          <div className="card-header">
            <div>
              <h2>Jobs</h2>
              <p>Work progress</p>
            </div>

            <Wrench size={21} />
          </div>

          <div className="progress-list">
            <div className="progress-item">
              <div>
                <span>Pending</span>
                <strong>{dashboard.jobs.pending}</strong>
              </div>

              <div className="progress-bar">
                <div
                  style={{
                    width:
                      dashboard.jobs.total > 0
                        ? `${(dashboard.jobs.pending / dashboard.jobs.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div>
                <span>Active</span>
                <strong>{dashboard.jobs.active}</strong>
              </div>

              <div className="progress-bar">
                <div
                  style={{
                    width:
                      dashboard.jobs.total > 0
                        ? `${(dashboard.jobs.active / dashboard.jobs.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div>
                <span>Completed</span>
                <strong>{dashboard.jobs.completed}</strong>
              </div>

              <div className="progress-bar">
                <div
                  style={{
                    width:
                      dashboard.jobs.total > 0
                        ? `${(dashboard.jobs.completed / dashboard.jobs.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Recent activity */}
      <div className="dashboard-grid recent-grid">
        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Recent Job Cards</h2>
              <p>Latest vehicle service jobs</p>
            </div>

            <Wrench size={21} />
          </div>

          {recentJobs.length === 0 ? (
            <div className="recent-empty">No recent job cards</div>
          ) : (
            <div className="recent-list">
              {recentJobs.map((job) => (
                <div className="recent-row" key={job._id}>
                  <div className="recent-main">
                    <strong>{job.customer?.name || "—"}</strong>
                    <span>
                      {job.vehicle?.make} {job.vehicle?.model} · {job.complaint}
                    </span>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Recent Invoices</h2>
              <p>Latest invoices issued</p>
            </div>

            <FileText size={21} />
          </div>

          {recentInvoices.length === 0 ? (
            <div className="recent-empty">No recent invoices</div>
          ) : (
            <div className="recent-list">
              {recentInvoices.map((inv) => (
                <div className="recent-row" key={inv._id}>
                  <div className="recent-main">
                    <strong>{inv.invoiceNumber}</strong>
                    <span>{inv.customer?.name || "—"}</span>
                  </div>
                  <strong className="recent-amount">
                    ${Number(inv.total || 0).toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-grid recent-grid">
        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Recent Payments</h2>
              <p>Latest payments received</p>
            </div>

            <CreditCard size={21} />
          </div>

          {recentPayments.length === 0 ? (
            <div className="recent-empty">No recent payments</div>
          ) : (
            <div className="recent-list">
              {recentPayments.map((payment) => (
                <div className="recent-row" key={payment._id}>
                  <Avatar name={payment.customer?.name} size={34} />
                  <div className="recent-main">
                    <strong>{payment.invoice?.invoiceNumber || "—"}</strong>
                    <span>
                      {payment.customer?.name || "—"} ·{" "}
                      {(payment.method || "").replace("_", " ")}
                    </span>
                  </div>
                  <strong className="recent-amount">
                    ${Number(payment.amount || 0).toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          )}

          <div className="card-footer-link">
            <button className="link-button" onClick={() => navigate("/payments")}>
              View all payments <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;