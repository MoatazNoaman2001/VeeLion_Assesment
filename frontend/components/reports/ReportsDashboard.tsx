"use client";

import { useState } from "react";
import { useTasksSummary } from "@/hooks/useTasksSummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { ErrorState } from "@/components/ui/StateMessage";
import { ReportsSkeleton } from "@/components/reports/ReportsSkeleton";
import { StatCard } from "@/components/reports/StatCard";
import { StatusBreakdown } from "@/components/reports/StatusBreakdown";
import { WindowSelector, type WindowOption } from "@/components/reports/WindowSelector";
import { formatPercent } from "@/lib/format";

const WINDOW_OPTIONS: WindowOption[] = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
];

function describeWindow(days: number) {
  return days === 1 ? "in the last 24 hours" : `in the last ${days} days`;
}

export function ReportsDashboard() {
  const [windowDays, setWindowDays] = useState(7);
  const { data: summary, error, loading, reload } = useTasksSummary(windowDays);

  function renderContent() {
    if (error) {
      return <ErrorState title="Couldn't load the report" message={error} onRetry={reload} />;
    }

    if (!summary) {
      return <ReportsSkeleton />;
    }

    const { total, byStatus, recentActivityCount } = summary;

    return (
      <div className={loading ? "stack is-refreshing" : "stack"} aria-busy={loading}>
        <div className="stat-grid">
          <StatCard label="Total tasks" value={total} hint={`${byStatus.todo} still to do`} />
          <StatCard
            label="Completion rate"
            value={formatPercent(byStatus.done, total)}
            hint={`${byStatus.done} of ${total} done`}
          />
          <StatCard
            label="Recent activity"
            value={recentActivityCount}
            hint={`${recentActivityCount === 1 ? "event" : "events"} ${describeWindow(windowDays)}`}
          />
        </div>

        <StatusBreakdown byStatus={byStatus} total={total} />
      </div>
    );
  }

  return (
    <section className="stack">
      <PageHeader
        title="Reports"
        description="A quick summary of your tasks and recent activity."
        actions={<RefreshButton loading={loading} onClick={reload} />}
      />

      <WindowSelector options={WINDOW_OPTIONS} value={windowDays} onChange={setWindowDays} />

      {renderContent()}
    </section>
  );
}
