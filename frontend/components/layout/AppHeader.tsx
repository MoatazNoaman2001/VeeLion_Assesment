"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/tasks", label: "Tasks" },
  { href: "/activity", label: "Activity" },
  { href: "/reports", label: "Reports" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link href="/" className="brand">
          <span className="brand__mark" aria-hidden="true">
            V
          </span>
          VeeLion
        </Link>

        <nav aria-label="Main" className="nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "nav__link nav__link--active" : "nav__link"}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
