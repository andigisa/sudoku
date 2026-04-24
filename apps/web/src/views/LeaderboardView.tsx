import { useEffect, useState } from "react";
import type { LeaderboardResponseDto, TournamentResponseDto } from "@sudoku/contracts";
import { fetchLeaderboard } from "../api/tournaments";

interface Props {
  tournament: TournamentResponseDto;
  onBack: () => void;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

export default function LeaderboardView({ tournament, onBack }: Props) {
  const [data, setData] = useState<LeaderboardResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard(tournament.id)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [tournament.id]);

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <button className="btn-ghost" onClick={onBack} type="button" style={{ padding: "4px 8px" }}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="app-title">{tournament.title}</span>
          <span />
        </div>
      </header>

      <main className="game-shell" style={{ maxWidth: 600 }}>
        <div style={{ padding: "0 0 12px" }}>
          <div className="tournament-badge" style={{ marginBottom: 8 }}>
            <span className="material-symbols-outlined">emoji_events</span>
            <span>Leaderboard</span>
            <span className={`tournament-status-badge tournament-status-badge--${tournament.status}`}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </span>
          </div>
        </div>

        {error && <div className="game-over-banner">{error}</div>}

        {!data && !error && (
          <div style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: 32 }}>
            Loading…
          </div>
        )}

        {data && data.total === 0 && (
          <div style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: 32 }}>
            No entries yet. Be the first to complete this tournament!
          </div>
        )}

        {data && data.total > 0 && (
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <span>#</span>
              <span>Player</span>
              <span>Score</span>
              <span>Time</span>
              <span>Mistakes</span>
            </div>
            {data.entries.map((entry) => (
              <div key={entry.rank} className="leaderboard-row">
                <span className="leaderboard-rank">{entry.rank}</span>
                <span className="leaderboard-name">{entry.display_name}</span>
                <span className="leaderboard-score">{entry.score}</span>
                <span className="leaderboard-time">{formatElapsed(entry.elapsed_ms)}</span>
                <span className="leaderboard-mistakes">{entry.mistakes}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
