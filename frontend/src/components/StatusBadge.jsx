const STATUS_TONES = {
  active: "good",
  inactive: "danger",
  pending: "warning",
  in_progress: "info",
  completed: "good",
  cancelled: "danger",
  paid: "good",
  partially_paid: "warning",
  unpaid: "danger",
  issued: "info",
  draft: "neutral",
  in_stock: "good",
  low_stock: "warning",
  out_of_stock: "danger",
};

const formatLabel = (status) => {
  if (!status) return "—";
  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const StatusBadge = ({ status, tone, dot = true }) => {
  const badgeTone = tone || STATUS_TONES[status] || "neutral";

  return (
    <span className={`status-badge ${badgeTone}`}>
      {dot && <span className="status-dot" aria-hidden="true" />}
      {formatLabel(status)}
    </span>
  );
};

export default StatusBadge;