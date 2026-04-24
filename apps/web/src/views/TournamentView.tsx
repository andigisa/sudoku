import type { TournamentResponseDto, SubmitEntryResponseDto } from "@sudoku/contracts";
import type { SerializedGameState } from "@sudoku/domain";
import ScoreBreakdown from "../components/ScoreBreakdown";

interface Props {
  tournament: TournamentResponseDto;
  gameState: SerializedGameState | null;
  submitting: boolean;
  submitResult: SubmitEntryResponseDto | null;
  submitError: string | null;
  onStartGame: () => void;
  onSubmitEntry: () => void;
  onViewLeaderboard: () => void;
  onBack: () => void;
}

export default function TournamentView({
  tournament,
  gameState,
  submitting,
  submitResult,
  submitError,
  onStartGame,
  onSubmitEntry,
  onViewLeaderboard,
  onBack
}: Props) {
  const isCompleted = !!gameState?.completedAt;
  const isGameOver = !!gameState?.gameOver;

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
        {/* Not yet started: show tournament info and start button */}
        {!gameState && !submitResult && (
          <div style={{ padding: "24px 0" }}>
            <div className="tournament-badge" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined">emoji_events</span>
              <span className={`tournament-status-badge tournament-status-badge--${tournament.status}`}>
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </span>
            </div>
            <h2 style={{ fontFamily: "Manrope, sans-serif", color: "var(--primary)", marginBottom: 8 }}>
              {tournament.title}
            </h2>
            <p style={{ color: "var(--on-surface-variant)", marginBottom: 24, lineHeight: 1.5 }}>
              Solve the shared puzzle as fast as possible. Your best attempt counts.
              Fewer mistakes and hints = higher score.
            </p>
            <div className="score-breakdown-lines" style={{ marginBottom: 24 }}>
              <div className="score-line">
                <span>Puzzle difficulty</span>
                <span style={{ textTransform: "capitalize" }}>{tournament.puzzle_id.split("-")[0]}</span>
              </div>
              <div className="score-line">
                <span>Mistake penalty</span>
                <span>−50 pts each</span>
              </div>
              <div className="score-line">
                <span>Min solve time</span>
                <span>20 seconds</span>
              </div>
            </div>
            {tournament.status === "active" ? (
              <button className="btn-primary" onClick={onStartGame} type="button">
                <span className="material-symbols-outlined">play_arrow</span>
                Start Tournament Puzzle
              </button>
            ) : (
              <button className="btn-primary" onClick={onViewLeaderboard} type="button">
                <span className="material-symbols-outlined">leaderboard</span>
                View Leaderboard
              </button>
            )}
          </div>
        )}

        {/* Game in progress — the board is rendered by App.tsx; this just shows contextual info */}
        {gameState && !submitResult && (
          <div style={{ padding: "8px 0 16px" }}>
            <div
              className="tournament-badge"
              style={{ marginBottom: 8, background: "var(--secondary-container)", borderRadius: 8, padding: "6px 12px" }}
            >
              <span className="material-symbols-outlined">emoji_events</span>
              <span style={{ fontWeight: 700 }}>Tournament mode</span>
            </div>

            {isGameOver && (
              <div className="game-over-banner" style={{ marginBottom: 12 }}>
                Game Over — too many mistakes. You cannot submit this attempt.
                <button className="btn-pill" onClick={onBack} style={{ marginTop: 12 }} type="button">
                  Back to Tournament
                </button>
              </div>
            )}

            {isCompleted && !submitResult && (
              <div className="completed-banner" style={{ marginBottom: 12 }}>
                Puzzle solved!
                {submitError && (
                  <div style={{ color: "var(--error)", marginTop: 8, fontSize: "0.85rem" }}>{submitError}</div>
                )}
                <button
                  className="btn-primary"
                  disabled={submitting}
                  onClick={onSubmitEntry}
                  style={{ marginTop: 12 }}
                  type="button"
                >
                  {submitting ? "Submitting…" : "Submit to Tournament"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Post-submission: score breakdown */}
        {submitResult && gameState && (
          <div style={{ padding: "24px 0" }}>
            <ScoreBreakdown
              entry={submitResult}
              difficulty={gameState.puzzle.difficulty}
              hintsUsed={0}
              mistakes={gameState.mistakes}
              onViewLeaderboard={onViewLeaderboard}
            />
          </div>
        )}
      </main>
    </>
  );
}
