export type WindowOption = {
  days: number;
  label: string;
};

type WindowSelectorProps = {
  options: WindowOption[];
  value: number;
  onChange: (days: number) => void;
};

export function WindowSelector({ options, value, onChange }: WindowSelectorProps) {
  return (
    <div className="toolbar-row">
      <span className="toolbar-row__label" id="activity-window-label">
        Recent activity window
      </span>
      <div className="segmented" role="group" aria-labelledby="activity-window-label">
        {options.map((option) => (
          <button
            key={option.days}
            type="button"
            className="segmented__option"
            onClick={() => onChange(option.days)}
            aria-pressed={option.days === value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
