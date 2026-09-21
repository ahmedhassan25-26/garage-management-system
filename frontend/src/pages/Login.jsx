import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Wrench,
  CheckCircle2,
  Car,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import GarageHero from "../components/GarageHero";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);
      login(response.data.token, response.data.user);
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Car,
      label: "Vehicles & job cards",
    },
    {
      icon: ClipboardList,
      label: "Invoices & payments",
    },
    {
      icon: ShieldCheck,
      label: "Role-based access",
    },
  ];

  return (
    <div className="login-page">
      <div className="login-brand-side">
        <div className="login-brand-logo">
          <Wrench size={30} />
        </div>

        <h2>Garage Pro</h2>
        <p className="login-brand-subtitle">
          Garage Management System
        </p>

        <div className="login-brand-divider" />

        <p className="login-brand-tagline">
          Streamline customers, vehicles, job cards, inventory
          and invoicing in one professional workspace.
        </p>

        <div className="login-features">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div className="login-feature" key={feature.label}>
                <span className="login-feature-icon">
                  <Icon size={16} />
                </span>
                <span>{feature.label}</span>
              </div>
            );
          })}
        </div>

        <div className="login-hero-wrap">
          <GarageHero />
        </div>
      </div>

      <div className="login-card">
        <div className="login-mobile-brand">
          <div className="login-brand-logo login-brand-logo-inline">
            <Wrench size={22} />
          </div>

          <div>
            <strong>Garage Pro</strong>
            <span>Garage Management System</span>
          </div>
        </div>

        <h1>Sign in</h1>

        <p className="login-subtitle">
          Enter your credentials to access your workspace
        </p>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>

            <input
              id="login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@garage.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>

            <div className="password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={!formData.password}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  className="login-spin"
                  size={17}
                />
                Signing in...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="login-footer">
          Protected workspace — your data stays with your garage team.
        </p>
      </div>
    </div>
  );
};

export default Login;