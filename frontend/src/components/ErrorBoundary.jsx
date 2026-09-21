import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import "./ErrorBoundary.css";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Application error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-error" role="alert">
        <AlertTriangle size={38} />
        <h1>Something went wrong</h1>
        <p>Please refresh the page. If the problem continues, contact your administrator.</p>
        <button onClick={() => window.location.reload()}>
          <RefreshCw size={18} /> Reload application
        </button>
      </main>
    );
  }
}

export default ErrorBoundary;
