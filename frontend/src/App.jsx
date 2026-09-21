import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { lazy, Suspense } from "react";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const JobCards = lazy(() => import("./pages/JobCards"));
const Users = lazy(() => import("./pages/Users"));
const SpareParts = lazy(() => import("./pages/SpareParts"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Payments = lazy(() => import("./pages/Payments"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Reports = lazy(() => import("./pages/Reports"));


import MainLayout from "./layouts/MainLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { can } from "./utils/permissions";

const ProtectedRoute = ({ children }) => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return <div className="route-loading">Loading workspace…</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

const RoleRoute = ({ roles, children }) => {
  const { user } = useAuth();

  return roles.includes(user?.role) ? children : <Navigate to="/dashboard" replace />;
};

const PermissionRoute = ({ permission, children }) => {
  const { user } = useAuth();

  return can(user?.role, permission) ? children : <Navigate to="/customers" replace />;
};

const DefaultRoute = () => {
  const { user } = useAuth();

  return <Navigate to={can(user?.role, "dashboard.view") ? "/dashboard" : "/customers"} replace />;
};

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="route-loading">Loading workspace…</div>}>
      <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<PermissionRoute permission="dashboard.view"><Dashboard /></PermissionRoute>}
        />

        <Route
          path="/customers"
          element={<Customers />}
        />

        <Route
          path="/vehicles"
          element={<Vehicles />}
        />

        <Route
          path="/job-cards"
          element={<JobCards />}
        />

        <Route
          path="/spare-parts"
          element={<SpareParts />}
        />

        <Route
          path="/invoices"
          element={<PermissionRoute permission="invoices.view"><Invoices /></PermissionRoute>}
        />

        <Route path="/reports" element={<RoleRoute roles={["admin", "manager"]}><Reports /></RoleRoute>} />

        <Route
         path="/payments"
          element={<RoleRoute roles={["admin", "manager", "receptionist"]}><Payments/></RoleRoute>}
        />

        <Route
          path="/users"
          element={<RoleRoute roles={["admin"]}><Users /></RoleRoute>}
        />

        <Route
          path="/audit-logs"
          element={<RoleRoute roles={["admin", "manager"]}><AuditLogs /></RoleRoute>}
        />
      </Route>

      <Route
        path="/"
        element={<DefaultRoute />}
      />

      <Route
        path="*"
        element={<DefaultRoute />}
      />
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
