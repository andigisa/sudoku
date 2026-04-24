import type { DifficultyDto } from "@sudoku/contracts";

const BASE_POINTS: Record<DifficultyDto, number> = {
  easy: 1000,
  medium: 1500,
  hard: 2200,
  expert: 3000
};

/**
 * Calculate a tournament score from raw inputs.
 * The result is clamped to 0 — the spec does not address negative scores,
 * and negative values break leaderboard UX without changing relative ranking.
 */
export function calculateScore(
  difficulty: DifficultyDto,
  mistakes: number,
  hintsUsed: number,
  rulesetVersion: string
): number {
  if (rulesetVersion !== "v1") {
    throw new Error(`Unknown ruleset version: ${rulesetVersion}`);
  }

  // Stage 3 formula: base × completion_multiplier(1.0) × time_multiplier(1.0) − penalties
  const raw = BASE_POINTS[difficulty] - 50 * mistakes - 100 * hintsUsed;
  return Math.max(0, raw);
}
