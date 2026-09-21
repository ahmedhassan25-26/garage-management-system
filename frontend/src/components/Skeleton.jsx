import "./Skeleton.css";

const Skeleton = ({ width, height, circle, className = "" }) => {
  return (
    <span
      className={`skeleton ${circle ? "skeleton-circle" : ""} ${className}`}
      style={{
        width: circle ? height : width,
        height,
      }}
    />
  );
};

const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="skeleton-table" aria-hidden="true">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} width="55%" />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, r) => (
        <div className="skeleton-table-row" key={r}>
          <div className="skeleton-cell-avatar">
            <Skeleton circle height={36} width={36} />
            <Skeleton height={11} width="70%" />
          </div>

          {Array.from({ length: cols - 1 }).map((_, i) => (
            <Skeleton key={i} height={11} width="65%" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
export { SkeletonTable };