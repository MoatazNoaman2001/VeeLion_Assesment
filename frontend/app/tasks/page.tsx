import type { Metadata } from "next";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";

export const metadata: Metadata = {
  title: "Tasks",
};

export default function TasksPage() {
  return <TaskDashboard />;
}
