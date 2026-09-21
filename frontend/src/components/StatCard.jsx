const StatCard = ({ icon: Icon, label, value, tone = "blue", sub }) => {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${tone}`}>
        <Icon size={20} />
      </div>

      <div className="stat-card-content">
        <strong>{value}</strong>
        <span>{label}</span>
        {sub && <small className="stat-card-sub">{sub}</small>}
      </div>
    </div>
  );
};

export default StatCard;