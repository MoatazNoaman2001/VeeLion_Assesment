"use client";

import { useCallback, useMemo, useState } from "react";
import { ApiError, getErrorMessage, requestJson } from "@/lib/apiClient";
import { useApiResource } from "@/hooks/useApiResource";
import type { Task, TaskFilter, TaskResponse, TasksResponse } from "@/types/api";

const NO_TASKS: Task[] = [];

function withoutId(ids: ReadonlySet<string>, id: string) {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

export function useTasks() {
  const { data, setData, error, loading, reload } = useApiResource<TasksResponse>(
    "/api/tasks",
    "Could not load tasks right now."
  );
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  const tasks = data?.data ?? NO_TASKS;

  const updateTaskStatus = useCallback(
    async (taskId: string, completed: boolean) => {
      setPendingIds((ids) => new Set(ids).add(taskId));
      setActionError(null);

      try {
        const body = await requestJson<TaskResponse>(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: "PATCH",
          body: JSON.stringify({ completed }),
        });

        setData((current) =>
          current && { data: current.data.map((task) => (task.id === taskId ? body.data : task)) }
        );
      } catch (updateError) {
        if (updateError instanceof ApiError && updateError.status === 404) {
          setData((current) => current && { data: current.data.filter((task) => task.id !== taskId) });
          setActionError("That task no longer exists, so it was removed from the list.");
        } else {
          setActionError(getErrorMessage(updateError, "Could not update task status."));
        }
      } finally {
        setPendingIds((ids) => withoutId(ids, taskId));
      }
    },
    [setData]
  );

  const dismissActionError = useCallback(() => setActionError(null), []);

  const counts = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    return { all: tasks.length, completed, pending: tasks.length - completed };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }

    if (filter === "pending") {
      return tasks.filter((task) => !task.completed);
    }

    return tasks;
  }, [tasks, filter]);

  return {
    hasLoaded: data !== null,
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
  };
}
