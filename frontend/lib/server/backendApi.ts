import "server-only";

import { BACKEND_API_URL, BACKEND_TIMEOUT_MS } from "@/lib/server/config";
import type {
  ActivityLog,
  ErrorResponse,
  Task,
  TaskResponse,
  TasksResponse,
  TasksSummary,
} from "@/types/api";

export class BackendError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "BackendError";
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error?.message || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

async function backendRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BACKEND_API_URL}${path}`, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new BackendError(504, "The task service took too long to respond.");
    }
    throw new BackendError(502, "The task service is unavailable. Please try again shortly.");
  }

  if (!response.ok) {
    const status = response.status >= 500 ? 502 : response.status;
    throw new BackendError(status, await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

export async function getTasksFromBackend(): Promise<Task[]> {
  const body = await backendRequest<TasksResponse>("/tasks");
  return body.data;
}

export async function updateTaskInBackend(taskId: string, completed: boolean): Promise<Task> {
  const body = await backendRequest<TaskResponse>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
  return body.data;
}

export async function getActivityFromBackend(): Promise<ActivityLog[]> {
  return backendRequest<ActivityLog[]>("/activity");
}

export async function getTasksSummaryFromBackend(windowDays?: number): Promise<TasksSummary> {
  const query = windowDays === undefined ? "" : `?days=${windowDays}`;
  return backendRequest<TasksSummary>(`/reports/tasks-summary${query}`);
}
