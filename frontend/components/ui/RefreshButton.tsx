import { RefreshIcon } from "@/components/ui/icons";

type RefreshButtonProps = {
  loading: boolean;
  onClick: () => void;
};

export function RefreshButton({ loading, onClick }: RefreshButtonProps) {
  return (
    <button type="button" className="button" onClick={onClick} disabled={loading}>
      <RefreshIcon className={loading ? "icon--spin" : undefined} />
      {loading ? "Refreshing…" : "Refresh"}
    </button>
  );
}
