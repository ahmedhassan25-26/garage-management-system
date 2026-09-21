import { RefreshCw } from "lucide-react";

const LoadingState = ({ label = "Loading..." }) => {
  return (
    <div className="state" role="status">
      <RefreshCw className="state-spinner" size={32} />
      <p>{label}</p>
    </div>
  );
};

export default LoadingState;