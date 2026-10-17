import { formatDateTime, formatRelativeTime } from "@/lib/format";

type RelativeTimeProps = {
  value: string;
  className?: string;
};

export function RelativeTime({ value, className }: RelativeTimeProps) {
  return (
    <time className={className} dateTime={value} title={formatDateTime(value)}>
      {formatRelativeTime(value)}
    </time>
  );
}
