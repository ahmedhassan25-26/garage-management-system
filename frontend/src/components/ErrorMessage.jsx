import { AlertTriangle, RefreshCw } from "lucide-react";

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message" role="alert">
      <AlertTriangle size={17} />
      <span>{message}</span>

      {onRetry && (
        <button className="error-retry" onClick={onRetry}>
          <RefreshCw size={15} />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;