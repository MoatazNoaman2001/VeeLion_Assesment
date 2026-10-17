export function ReportsSkeleton() {
  return (
    <div className="stack" role="status" aria-busy="true">
      <span className="visually-hidden">Loading report…</span>
      <div className="stat-grid">
        {[0, 1, 2].map((key) => (
          <div key={key} className="card stat-card">
            <span className="skeleton skeleton--line skeleton--short" />
            <span className="skeleton skeleton--value" />
            <span className="skeleton skeleton--line" />
          </div>
        ))}
      </div>
      <div className="card breakdown">
        <span className="skeleton skeleton--line skeleton--short" />
        <span className="skeleton skeleton--bar" />
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--line" />
      </div>
    </div>
  );
}
