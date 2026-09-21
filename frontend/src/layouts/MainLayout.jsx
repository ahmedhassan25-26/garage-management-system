import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Package,
  FileText,
  CreditCard,
  UserCog,
  History,
  LogOut,
  Menu,
  X,
  Wrench,
  Bell,
  ArrowRight,
  AlertTriangle,
  ClipboardCheck,
  FileWarning,
  LayoutGrid,
} from "lucide-react";

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./MainLayout.css";
import { can } from "../utils/permissions";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState({ lowStock: 0, pendingJobs: 0, unpaidInvoices: 0 });
  const bellRef = useRef(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    api
      .get("/dashboard")
      .then((res) => {
        if (!mounted || !res.data?.dashboard) return;
        const d = res.data.dashboard;
        setAlerts({
          lowStock: d.inventory?.lowStock || 0,
          pendingJobs: d.jobs?.pending || 0,
          unpaidInvoices: d.invoices?.unpaid || 0,
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    {
      label: "MAIN",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          permission: "dashboard.view",
        },
        {
          name: "Customers",
          path: "/customers",
          icon: Users,
          permission: "customers.view",
        },
        {
          name: "Vehicles",
          path: "/vehicles",
          icon: Car,
          permission: "vehicles.view",
        },
        {
          name: "Job Cards",
          path: "/job-cards",
          icon: ClipboardList,
          permission: "jobs.view",
        },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        {
          name: "Spare Parts",
          path: "/spare-parts",
          icon: Package,
          permission: "inventory.view",
        },
        {
          name: "Invoices",
          path: "/invoices",
          icon: FileText,
          permission: "invoices.view",
        },
        {
          name: "Reports",
          path: "/reports",
          icon: LayoutGrid,
          permission: "reports.view",
        },
        {
          name: "Payments",
          path: "/payments",
          icon: CreditCard,
          permission: "payments.view",
        },
      ],
    },
    {
      label: "ADMINISTRATION",
      items: [
        {
          name: "Users",
          path: "/users",
          icon: UserCog,
          permission: "users.manage",
        },
        {
          name: "Audit Logs",
          path: "/audit-logs",
          icon: History,
          permission: "audit.view",
        },
      ],
    },
  ];

  const canSee = (item) => {
      return !item.permission || can(user?.role, item.permission);
  };

  const currentItem = navigation
    .flatMap((section) => section.items)
    .find((item) => item.path === location.pathname);

  const totalAlerts = alerts.lowStock + alerts.pendingJobs + alerts.unpaidInvoices;

  const notificationItems = [
    {
      key: "lowStock",
      label: `${alerts.lowStock} item${alerts.lowStock === 1 ? "" : "s"} low in stock`,
      path: "/spare-parts",
      icon: AlertTriangle,
      empty: alerts.lowStock === 0,
    },
    {
      key: "pendingJobs",
      label: `${alerts.pendingJobs} job card${alerts.pendingJobs === 1 ? "" : "s"} pending`,
      path: "/job-cards",
      icon: ClipboardCheck,
      empty: alerts.pendingJobs === 0,
    },
    {
      key: "unpaidInvoices",
      label: `${alerts.unpaidInvoices} invoice${alerts.unpaidInvoices === 1 ? "" : "s"} unpaid`,
      path: "/invoices",
      icon: FileWarning,
      empty: alerts.unpaidInvoices === 0,
    },
  ];

  const hasAlerts = totalAlerts > 0;

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Wrench size={21} />
          </div>

          <div>
            <strong>Garage Pro</strong>
            <span>Management System</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((section) => (
            <div className="nav-section" key={section.label}>
              <p>{section.label}</p>

              {section.items.filter(canSee).map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="user-avatar user-avatar-initials">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user?.name || "User"}</strong>
              <span className="role-chip role-chip-sidebar">
                {user?.role || "Staff"}
              </span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={() => {
              setSidebarOpen(false);
              handleLogout();
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          <div className="topbar-title">
            <strong>{currentItem?.name || "Garage Pro"}</strong>
            <span>Professional garage &amp; workshop management</span>
          </div>

          <div className="topbar-right">
            <div className="notif-wrap" ref={bellRef}>
              <button
                className={`topbar-icon-btn ${hasAlerts ? "has-alerts" : ""}`}
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                aria-expanded={notifOpen}
              >
                <Bell size={18} />
                {hasAlerts && <span className="notif-badge">{totalAlerts}</span>}
              </button>

              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    <strong>Notifications</strong>
                  </div>

                  {!hasAlerts ? (
                    <div className="notif-empty">You're all caught up</div>
                  ) : (
                    <div className="notif-list">
                      {notificationItems.map((item) => {
                        if (item.empty) return null;
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.key}
                            className="notif-item"
                            onClick={() => navigate(item.path)}
                          >
                            <span className="notif-item-icon">
                              <Icon size={16} />
                            </span>
                            <span className="notif-item-text">{item.label}</span>
                            <ArrowRight size={15} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="topbar-user">
              <div className="topbar-avatar topbar-avatar-initials">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <strong>{user?.name || "User"}</strong>
                <span className="role-chip">{user?.role || "Staff"}</span>
              </div>
            </div>

            <button
              className="topbar-icon-btn"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;