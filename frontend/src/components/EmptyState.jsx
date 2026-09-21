const EmptyState = ({
  icon: Icon,
  title,
  hint,
  action,
  iconSize = 42,
}) => {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon" aria-hidden="true">
          <Icon size={iconSize} strokeWidth={1.6} />
        </div>
      )}

      {title && <h3>{title}</h3>}
      {hint && <p>{hint}</p>}

      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;