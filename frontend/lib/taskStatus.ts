import type { TaskStatus } from "@/types/api";

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "in-progress", "done"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};
