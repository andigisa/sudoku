import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
export const guests = sqliteTable("guests", {
    guestId: text("guest_id").primaryKey(),
    createdAt: text("created_at").notNull()
});
export const gameSessions = sqliteTable("game_sessions", {
    sessionId: text("session_id").primaryKey(),
    guestId: text("guest_id").notNull(),
    userId: text("user_id"),
    puzzleId: text("puzzle_id").notNull(),
    difficulty: text("difficulty").notNull(),
    stateJson: text("state_json").notNull(),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    elapsedMs: integer("elapsed_ms").notNull().default(0),
    mistakes: integer("mistakes").notNull().default(0)
});
export const dailyChallenges = sqliteTable("daily_challenges", {
    challengeDate: text("challenge_date").primaryKey(),
    puzzleId: text("puzzle_id").notNull(),
    difficulty: text("difficulty").notNull()
});
export const tournaments = sqliteTable("tournament", {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    puzzleId: text("puzzle_id").notNull(),
    rulesetVersion: text("ruleset_version").notNull(),
    status: text("status").notNull().default("upcoming")
});
export const tournamentEntries = sqliteTable("tournament_entry", {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull(),
    guestId: text("guest_id").notNull(),
    userId: text("user_id"),
    sessionId: text("session_id").notNull(),
    elapsedMs: integer("elapsed_ms").notNull(),
    mistakes: integer("mistakes").notNull(),
    hintsUsed: integer("hints_used").notNull().default(0),
    finalBoard: text("final_board").notNull(),
    rawScore: integer("raw_score").notNull(),
    status: text("status").notNull().default("valid"),
    createdAt: text("created_at").notNull()
});
export const leaderboardSnapshots = sqliteTable("leaderboard_snapshot", {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull(),
    guestId: text("guest_id").notNull(),
    userId: text("user_id"),
    entryId: text("entry_id").notNull(),
    rank: integer("rank").notNull(),
    score: integer("score").notNull(),
    updatedAt: text("updated_at").notNull()
}, (t) => [unique("leaderboard_snapshot_tournament_guest").on(t.tournamentId, t.guestId)]);
export const abuseFlags = sqliteTable("abuse_flag", {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull(),
    guestId: text("guest_id").notNull(),
    userId: text("user_id"),
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull()
});
// ── Auth tables ──────────────────────────────────────────────────────────────
export const users = sqliteTable("user", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    guestId: text("guest_id"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
});
export const passwordCredentials = sqliteTable("password_credential", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    hash: text("hash").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
});
export const userSessions = sqliteTable("user_session", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at")
});
export const syncStates = sqliteTable("sync_state", {
    userId: text("user_id").primaryKey(),
    settingsJson: text("settings_json").notNull().default("{}"),
    version: integer("version").notNull().default(0),
    updatedAt: text("updated_at").notNull()
});
//# sourceMappingURL=schema.js.map