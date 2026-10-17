import { memo } from "react";
import type { ActivityLog } from "@/types/api";
import { RelativeTime } from "@/components/ui/RelativeTime";

type ActivityItemProps = {
  entry: ActivityLog;
};

function asText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export const ActivityItem = memo(function ActivityItem({ entry }: ActivityItemProps) {
  const action = asText(entry.action);
  const info = asText(entry.info);

  return (
    <li className="activity-item">
      <span className="activity-item__dot" aria-hidden="true" />
      <div className="activity-item__body">
        <p className={action ? "activity-item__action" : "activity-item__action is-placeholder"}>
          {action ?? "No action"}
        </p>
        {info ? <p className="activity-item__info">{info}</p> : null}
      </div>
      <RelativeTime className="activity-item__time" value={entry.when} />
    </li>
  );
});
