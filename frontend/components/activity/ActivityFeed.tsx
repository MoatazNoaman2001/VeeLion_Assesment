"use client";

import { useActivity } from "@/hooks/useActivity";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { SearchIcon } from "@/components/ui/icons";
import { ActivityItem } from "@/components/activity/ActivityItem";

export function ActivityFeed() {
  const { hasLoaded, entries, visibleEntries, query, setQuery, error, loading, reload } = useActivity();

  function renderContent() {
    if (error) {
      return <ErrorState title="Couldn't load activity" message={error} onRetry={reload} />;
    }

    if (!hasLoaded) {
      return <SkeletonList label="Loading activity…" rows={5} />;
    }

    if (entries.length === 0) {
      return <EmptyState title="No activity yet" message="Actions will show up here as they happen." />;
    }

    if (visibleEntries.length === 0) {
      return <EmptyState title="No matches" message={`Nothing matches "${query.trim()}".`} />;
    }

    return (
      <ul className="card activity-list" aria-label="Activity">
        {visibleEntries.map((entry) => (
          <ActivityItem key={entry.id} entry={entry} />
        ))}
      </ul>
    );
  }

  return (
    <section className="stack">
      <PageHeader
        title="Activity Feed"
        description="Everything that happened, newest first."
        actions={<RefreshButton loading={loading} onClick={reload} />}
      />

      <div className="card toolbar">
        <label className="search-field">
          <span className="visually-hidden">Search activity</span>
          <SearchIcon className="search-field__icon" />
          <input
            className="input search-field__input"
            type="search"
            placeholder="Search by action or details"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {hasLoaded ? (
          <p className="toolbar__meta" aria-live="polite">
            Showing {visibleEntries.length} of {entries.length}
          </p>
        ) : null}
      </div>

      {renderContent()}
    </section>
  );
}
