import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VeeLion Tasks",
    template: "%s · VeeLion Tasks",
  },
  description: "Task dashboard, activity feed and reports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
