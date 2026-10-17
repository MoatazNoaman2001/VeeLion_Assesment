import { memo } from "react";
import type { Task } from "@/types/api";
import { CheckIcon } from "@/components/ui/icons";
import { RelativeTime } from "@/components/ui/RelativeTime";

type TaskItemProps = {
  task: Task;
  busy: boolean;
  onToggle: (task: Task) => void;
};

export const TaskItem = memo(function TaskItem({ task, busy, onToggle }: TaskItemProps) {
  const statusLabel = task.completed ? "Completed" : "Pending";

  return (
    <li className={task.completed ? "task-item task-item--done" : "task-item"}>
      <button
        type="button"
        className="task-toggle"
        onClick={() => onToggle(task)}
        disabled={busy}
        aria-label={`Mark ${task.title} as ${task.completed ? "pending" : "completed"}`}
      >
        {busy ? <span className="spinner" aria-hidden="true" /> : task.completed ? <CheckIcon /> : null}
      </button>

      <div className="task-item__body">
        <p className="task-item__title">{task.title}</p>
        <p className="task-item__meta">
          Updated <RelativeTime value={task.updatedAt} />
        </p>
      </div>

      <span className={`badge ${task.completed ? "badge--done" : "badge--todo"}`} aria-live="polite">
        {busy ? "Saving…" : statusLabel}
      </span>
    </li>
  );
});
