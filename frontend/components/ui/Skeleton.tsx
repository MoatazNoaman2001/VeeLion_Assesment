type SkeletonListProps = {
  label: string;
  rows?: number;
};

export function SkeletonList({ label, rows = 4 }: SkeletonListProps) {
  return (
    <div className="card skeleton-list" role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton-row">
          <span className="skeleton skeleton--circle" />
          <span className="skeleton-row__lines">
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line skeleton--short" />
          </span>
        </div>
      ))}
    </div>
  );
}
