"use client";

import { useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ErrorBanner, ErrorState } from "@/components/ui/StateMessage";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskList } from "@/components/tasks/TaskList";

export function TaskDashboard() {
  const {
    hasLoaded,
    filteredTasks,
    counts,
    filter,
    loading,
    error,
    actionError,
    pendingIds,
    setFilter,
    reload,
    updateTaskStatus,
    dismissActionError,
  } = useTasks();

  const handleToggle = useCallback(
    (task: Task) => updateTaskStatus(task.id, !task.completed),
    [updateTaskStatus]
  );

  const description = hasLoaded
    ? `${counts.pending} pending · ${counts.completed} completed`
    : "Track and update the status of your tasks.";

  return (
    <section className="stack">
      <PageHeader
        title="Task Dashboard"
        description={description}
        actions={<RefreshButton loading={loading} onClick={reload} />}
      />

      <StatusFilter value={filter} counts={counts} onChange={setFilter} />

      {actionError ? <ErrorBanner message={actionError} onDismiss={dismissActionError} /> : null}

      {error ? (
        <ErrorState title="Couldn't load tasks" message={error} onRetry={reload} />
      ) : !hasLoaded ? (
        <SkeletonList label="Loading tasks…" />
      ) : (
        <TaskList tasks={filteredTasks} pendingIds={pendingIds} onToggle={handleToggle} />
      )}
    </section>
  );
}
