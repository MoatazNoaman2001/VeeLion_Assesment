"use client";

import { useApiResource } from "@/hooks/useApiResource";
import type { TasksSummary } from "@/types/api";

export function useTasksSummary(windowDays: number) {
  return useApiResource<TasksSummary>(
    `/api/reports/tasks-summary?days=${windowDays}`,
    "Could not load the report right now."
  );
}
