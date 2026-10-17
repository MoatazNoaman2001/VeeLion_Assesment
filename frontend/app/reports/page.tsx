import type { Metadata } from "next";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return <ReportsDashboard />;
}
