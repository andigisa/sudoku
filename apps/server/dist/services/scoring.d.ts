import type { DifficultyDto } from "@sudoku/contracts";
/**
 * Calculate a tournament score from raw inputs.
 * The result is clamped to 0 — the spec does not address negative scores,
 * and negative values break leaderboard UX without changing relative ranking.
 */
export declare function calculateScore(difficulty: DifficultyDto, mistakes: number, hintsUsed: number, rulesetVersion: string): number;
