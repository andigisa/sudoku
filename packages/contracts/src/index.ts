import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard", "expert"]);

export const puzzleResponseSchema = z.object({
  puzzle_id: z.string(),
  givens: z.string().regex(/^[0-9]{81}$/),
  difficulty: difficultySchema,
  generator_version: z.string(),
  solution_checksum: z.string()
});

export const sessionResponseSchema = z.object({
  session_id: z.string(),
  puzzle_id: z.string(),
  difficulty: difficultySchema,
  state_json: z.string(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  elapsed_ms: z.number(),
  mistakes: z.number()
});

export const createSessionRequestSchema = z.object({
  puzzle_id: z.string(),
  difficulty: difficultySchema,
  state_json: z.string()
});

export const updateSessionRequestSchema = z.object({
  state_json: z.string(),
  elapsed_ms: z.number().int().nonnegative(),
  mistakes: z.number().int().nonnegative(),
  completed_at: z.string().nullable()
});

export const dailyChallengeResponseSchema = z.object({
  date: z.string(),
  puzzle: puzzleResponseSchema,
  session: sessionResponseSchema.nullable()
});

export const telemetryEventSchema = z.object({
  event: z.string(),
  session_id: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional()
});

// ── Tournament ────────────────────────────────────────────────────────────────

export const tournamentStatusSchema = z.enum(["upcoming", "active", "ended"]);

export const tournamentResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  puzzle_id: z.string(),
  ruleset_version: z.string(),
  status: tournamentStatusSchema
});

export const createTournamentRequestSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  starts_at: z.string(),
  ends_at: z.string(),
  puzzle_id: z.string()
});

export const submitEntryRequestSchema = z.object({
  session_id: z.string(),
  elapsed_ms: z.number().int().nonnegative(),
  mistakes: z.number().int().nonnegative(),
  hints_used: z.number().int().nonnegative(),
  final_board: z.string().regex(/^[1-9]{81}$/)
});

export const submitEntryResponseSchema = z.object({
  entry_id: z.string(),
  score: z.number(),
  rank: z.number().nullable(),
  is_best: z.boolean(),
  idempotent: z.boolean()
});

export const leaderboardEntrySchema = z.object({
  rank: z.number(),
  display_name: z.string(),
  score: z.number(),
  elapsed_ms: z.number(),
  mistakes: z.number(),
  hints_used: z.number(),
  submitted_at: z.string()
});

export const leaderboardResponseSchema = z.object({
  tournament_id: z.string(),
  total: z.number(),
  entries: z.array(leaderboardEntrySchema)
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerRequestSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  display_name: z.string().min(1).max(30).optional()
});

export const loginRequestSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1)
});

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  display_name: z.string().nullable(),
  created_at: z.string()
});

export const authResponseSchema = z.object({
  user: userProfileSchema
});

export const updateProfileRequestSchema = z.object({
  display_name: z.string().min(1).max(30).nullable().optional()
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim())
});

// ── Sync ─────────────────────────────────────────────────────────────────────

export const syncBootstrapResponseSchema = z.object({
  user: userProfileSchema,
  settings: z.record(z.string(), z.string()),
  recent_sessions: z.array(sessionResponseSchema),
  in_progress_games: z.array(sessionResponseSchema),
  sync_version: z.number()
});

export const syncPushItemSchema = z.object({
  type: z.enum(["session_update", "setting_change"]),
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.string()
});

export const syncPushRequestSchema = z.object({
  last_known_version: z.number(),
  changes: z.array(syncPushItemSchema)
});

export const syncPushResultSchema = z.object({
  accepted: z.array(z.object({ index: z.number(), status: z.literal("accepted") })),
  rejected: z.array(z.object({ index: z.number(), status: z.literal("rejected"), reason: z.string() })),
  new_version: z.number()
});

// ── Types ────────────────────────────────────────────────────────────────────

export type DifficultyDto = z.infer<typeof difficultySchema>;
export type PuzzleResponseDto = z.infer<typeof puzzleResponseSchema>;
export type SessionResponseDto = z.infer<typeof sessionResponseSchema>;
export type CreateSessionRequestDto = z.infer<typeof createSessionRequestSchema>;
export type UpdateSessionRequestDto = z.infer<typeof updateSessionRequestSchema>;
export type DailyChallengeResponseDto = z.infer<typeof dailyChallengeResponseSchema>;
export type TelemetryEventDto = z.infer<typeof telemetryEventSchema>;
export type TournamentStatusDto = z.infer<typeof tournamentStatusSchema>;
export type TournamentResponseDto = z.infer<typeof tournamentResponseSchema>;
export type CreateTournamentRequestDto = z.infer<typeof createTournamentRequestSchema>;
export type SubmitEntryRequestDto = z.infer<typeof submitEntryRequestSchema>;
export type SubmitEntryResponseDto = z.infer<typeof submitEntryResponseSchema>;
export type LeaderboardEntryDto = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardResponseDto = z.infer<typeof leaderboardResponseSchema>;
export type RegisterRequestDto = z.infer<typeof registerRequestSchema>;
export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
export type UserProfileDto = z.infer<typeof userProfileSchema>;
export type AuthResponseDto = z.infer<typeof authResponseSchema>;
export type UpdateProfileRequestDto = z.infer<typeof updateProfileRequestSchema>;
export type PasswordResetRequestDto = z.infer<typeof passwordResetRequestSchema>;
export type SyncBootstrapResponseDto = z.infer<typeof syncBootstrapResponseSchema>;
export type SyncPushItemDto = z.infer<typeof syncPushItemSchema>;
export type SyncPushRequestDto = z.infer<typeof syncPushRequestSchema>;
export type SyncPushResultDto = z.infer<typeof syncPushResultSchema>;
