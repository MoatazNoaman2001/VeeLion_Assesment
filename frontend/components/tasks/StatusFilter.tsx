import type { TaskFilter } from "@/types/api";

const FILTERS: Array<{ label: string; value: TaskFilter }> = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];

type StatusFilterProps = {
  value: TaskFilter;
  counts: Record<TaskFilter, number>;
  onChange: (value: TaskFilter) => void;
};

export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
  return (
    <div className="segmented" role="group" aria-label="Filter tasks by status">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className="segmented__option"
          onClick={() => onChange(filter.value)}
          aria-pressed={filter.value === value}
        >
          {filter.label}
          <span className="segmented__count">{counts[filter.value]}</span>
        </button>
      ))}
    </div>
  );
}
