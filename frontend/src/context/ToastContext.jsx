import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import "./Toast.css";

const ToastContext = createContext(null);

let toastId = 0;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++toastId;
      setToasts((current) => [...current, { id, type, message }]);

      window.setTimeout(() => dismiss(id), 4200);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push]
  );

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div className={`toast toast-${t.type}`} key={t.id}>
            <span className="toast-icon">{icons[t.type]}</span>
            <span className="toast-message">{t.message}</span>
            <button
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export { ToastProvider, useToast };