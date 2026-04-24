import type { SubmitEntryResponseDto } from "@sudoku/contracts";
import type { DifficultyDto } from "@sudoku/contracts";

interface Props {
  entry: SubmitEntryResponseDto;
  difficulty: DifficultyDto;
  hintsUsed: number;
  mistakes: number;
  onViewLeaderboard: () => void;
}

const BASE_POINTS: Record<DifficultyDto, number> = {
  easy: 1000,
  medium: 1500,
  hard: 2200,
  expert: 3000
};

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

export default function ScoreBreakdown({ entry, difficulty, hintsUsed, mistakes, onViewLeaderboard }: Props) {
  const base = BASE_POINTS[difficulty];
  const mistakePenalty = 50 * mistakes;
  const hintPenalty = 100 * hintsUsed;

  return (
    <div className="score-breakdown">
      <div className="score-breakdown-header">
        <div className="score-rank-badge">#{entry.rank ?? "—"}</div>
        <div>
          <div className="score-breakdown-title">Your Score</div>
          {entry.is_best && <div className="score-best-tag">Personal Best</div>}
        </div>
      </div>

      <div className="score-breakdown-lines">
        <div className="score-line">
          <span>Base ({difficulty})</span>
          <span>+{base}</span>
        </div>
        {mistakePenalty > 0 && (
          <div className="score-line score-line--penalty">
            <span>Mistakes ({mistakes} × 50)</span>
            <span>−{mistakePenalty}</span>
          </div>
        )}
        {hintPenalty > 0 && (
          <div className="score-line score-line--penalty">
            <span>Hints ({hintsUsed} × 100)</span>
            <span>−{hintPenalty}</span>
          </div>
        )}
        <div className="score-line score-line--total">
          <span>Total Score</span>
          <span>{entry.score}</span>
        </div>
      </div>

      <button className="btn-primary" onClick={onViewLeaderboard} style={{ marginTop: 16 }} type="button">
        <span className="material-symbols-outlined">leaderboard</span>
        View Leaderboard
      </button>
    </div>
  );
}
