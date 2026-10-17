import type { Task } from "@/types/api";
import { EmptyState } from "@/components/ui/StateMessage";
import { TaskItem } from "@/components/tasks/TaskItem";

type TaskListProps = {
  tasks: Task[];
  pendingIds: ReadonlySet<string>;
  onToggle: (task: Task) => void;
};

export function TaskList({ tasks, pendingIds, onToggle }: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState title="Nothing here" message="No tasks match this filter." />;
  }

  return (
    <ul className="card task-list" aria-label="Tasks">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} busy={pendingIds.has(task.id)} onToggle={onToggle} />
      ))}
    </ul>
  );
}
