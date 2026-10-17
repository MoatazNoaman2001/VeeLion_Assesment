import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return <ActivityFeed />;
}
