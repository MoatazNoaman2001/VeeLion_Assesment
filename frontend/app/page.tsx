import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowRightIcon } from "@/components/ui/icons";

const MODULES = [
  {
    href: "/tasks",
    title: "Task Dashboard",
    description: "See every task, filter by status and mark work as done.",
  },
  {
    href: "/activity",
    title: "Activity Feed",
    description: "Search through what happened recently, newest first.",
  },
  {
    href: "/reports",
    title: "Reports",
    description: "Totals, status breakdown and recent activity at a glance.",
  },
];

export default function HomePage() {
  return (
    <section className="stack">
      <PageHeader title="Welcome back" description="Pick up where you left off." />

      <div className="module-grid">
        {MODULES.map((module) => (
          <Link key={module.href} href={module.href} className="card module-card">
            <h2 className="module-card__title">{module.title}</h2>
            <p className="module-card__description">{module.description}</p>
            <span className="module-card__link">
              Open <ArrowRightIcon />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
