import { formatPercent } from "@/lib/format";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/lib/taskStatus";
import type { TasksSummary } from "@/types/api";

type StatusBreakdownProps = {
  byStatus: TasksSummary["byStatus"];
  total: number;
};

export function StatusBreakdown({ byStatus, total }: StatusBreakdownProps) {
  const barLabel = TASK_STATUS_ORDER.map(
    (status) => `${TASK_STATUS_LABELS[status]}: ${byStatus[status]}`
  ).join(", ");

  return (
    <section className="card breakdown" aria-labelledby="breakdown-title">
      <h2 id="breakdown-title" className="section-title">
        Tasks by status
      </h2>

      <div className="breakdown__bar" role="img" aria-label={barLabel}>
        {TASK_STATUS_ORDER.map((status) =>
          byStatus[status] > 0 ? (
            <span
              key={status}
              className={`breakdown__segment status--${status}`}
              style={{ flexGrow: byStatus[status] }}
            />
          ) : null
        )}
      </div>

      <ul className="breakdown__legend">
        {TASK_STATUS_ORDER.map((status) => (
          <li key={status} className="breakdown__row">
            <span className={`swatch status--${status}`} aria-hidden="true" />
            <span className="breakdown__label">{TASK_STATUS_LABELS[status]}</span>
            <span className="breakdown__count">{byStatus[status]}</span>
            <span className="breakdown__percent">{formatPercent(byStatus[status], total)}</span>
          </li>
        ))}
      </ul>

      {byStatus["in-progress"] === 0 ? (
        <p className="note">
          Tasks only track done or not done for now, so &quot;In progress&quot; stays at 0.
        </p>
      ) : null}
    </section>
  );
}
