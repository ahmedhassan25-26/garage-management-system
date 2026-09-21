const PageHeader = ({ eyebrow, title, subtitle, children }) => {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="page-label">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {children && (
        <div className="page-header-actions">{children}</div>
      )}
    </div>
  );
};

export default PageHeader;