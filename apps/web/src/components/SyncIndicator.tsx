interface Props {
  status: "idle" | "syncing" | "synced" | "offline";
}

const icons: Record<Props["status"], string> = {
  idle: "cloud",
  syncing: "cloud_sync",
  synced: "cloud_done",
  offline: "cloud_off"
};

const labels: Record<Props["status"], string> = {
  idle: "Cloud",
  syncing: "Syncing...",
  synced: "Synced",
  offline: "Offline"
};

export default function SyncIndicator({ status }: Props) {
  return (
    <span className={`sync-indicator sync-indicator--${status}`}>
      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
        {icons[status]}
      </span>
      <span>{labels[status]}</span>
    </span>
  );
}
