import { useEffect, useState } from "react";
import type { TournamentResponseDto } from "@sudoku/contracts";

interface Props {
  tournament: TournamentResponseDto | null;
  onEnter: (tournamentId: string) => void;
  onViewLeaderboard: (tournamentId: string) => void;
  loading?: boolean;
}

function computeCountdown(tournament: TournamentResponseDto): string {
  const target =
    tournament.status === "upcoming"
      ? new Date(tournament.starts_at)
      : new Date(tournament.ends_at);

  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "—";

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return `${h}h ${m}m ${s}s`;
}

const STATUS_LABELS: Record<TournamentResponseDto["status"], string> = {
  upcoming: "Upcoming",
  active: "Active",
  ended: "Ended"
};

export default function TournamentCard({ tournament, onEnter, onViewLeaderboard, loading }: Props) {
  const [countdown, setCountdown] = useState<string>(() =>
    tournament ? computeCountdown(tournament) : "—"
  );

  useEffect(() => {
    if (!tournament || tournament.status === "ended") return;
    const timer = window.setInterval(() => setCountdown(computeCountdown(tournament)), 1000);
    return () => window.clearInterval(timer);
  }, [tournament]);

  if (!tournament) {
    return (
      <div className="tournament-card tournament-card--empty">
        <div className="tournament-badge">
          <span className="material-symbols-outlined">emoji_events</span>
          <span>Tournament</span>
        </div>
        <p className="tournament-empty-text">No active tournament right now.</p>
      </div>
    );
  }

  const canEnter = tournament.status === "active";

  return (
    <div className="tournament-card">
      <div className="tournament-badge">
        <span className="material-symbols-outlined">emoji_events</span>
        <span>Tournament</span>
        <span className={`tournament-status-badge tournament-status-badge--${tournament.status}`}>
          {STATUS_LABELS[tournament.status]}
        </span>
      </div>
      <h3 className="tournament-title">{tournament.title}</h3>
      <div className="tournament-countdown-row">
        <span className="material-symbols-outlined tournament-clock-icon">
          {tournament.status === "upcoming" ? "schedule" : "hourglass_bottom"}
        </span>
        <span className="tournament-countdown">
          {tournament.status === "ended"
            ? "Tournament ended"
            : tournament.status === "upcoming"
            ? `Starts in ${countdown}`
            : `Ends in ${countdown}`}
        </span>
      </div>
      <div className="tournament-card-actions">
        <button
          className="btn-pill"
          disabled={!canEnter || loading}
          onClick={() => onEnter(tournament.id)}
          type="button"
        >
          {tournament.status === "ended" ? "View Results" : "Enter"}
        </button>
        <button
          className="link-btn"
          onClick={() => onViewLeaderboard(tournament.id)}
          type="button"
        >
          Leaderboard
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}
