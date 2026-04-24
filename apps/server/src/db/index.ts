import { createRequire } from "node:module";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "../env.js";
import * as schema from "./schema.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3") as typeof import("better-sqlite3");

const dbDir = path.dirname(path.resolve(env.DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(env.DB_PATH) as InstanceType<typeof import("better-sqlite3")>;
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS guests (
    guest_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    session_id TEXT PRIMARY KEY,
    guest_id TEXT NOT NULL,
    puzzle_id TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    state_json TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    elapsed_ms INTEGER NOT NULL DEFAULT 0,
    mistakes INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS daily_challenges (
    challenge_date TEXT PRIMARY KEY,
    puzzle_id TEXT NOT NULL,
    difficulty TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tournament (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    puzzle_id TEXT NOT NULL,
    ruleset_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming'
  );

  CREATE TABLE IF NOT EXISTS tournament_entry (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    elapsed_ms INTEGER NOT NULL,
    mistakes INTEGER NOT NULL,
    hints_used INTEGER NOT NULL DEFAULT 0,
    final_board TEXT NOT NULL,
    raw_score INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leaderboard_snapshot (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    entry_id TEXT NOT NULL,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(tournament_id, guest_id)
  );

  CREATE TABLE IF NOT EXISTS abuse_flag (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_game_sessions_guest_id ON game_sessions(guest_id);
  CREATE INDEX IF NOT EXISTS idx_game_sessions_puzzle_id ON game_sessions(puzzle_id);
  CREATE INDEX IF NOT EXISTS idx_tournament_status ON tournament(status, starts_at);
  CREATE INDEX IF NOT EXISTS idx_tournament_entry_tournament_guest ON tournament_entry(tournament_id, guest_id);
  CREATE INDEX IF NOT EXISTS idx_tournament_entry_score ON tournament_entry(tournament_id, raw_score);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshot_tournament ON leaderboard_snapshot(tournament_id, score);
`);

export const db = drizzle(sqlite as Parameters<typeof drizzle>[0], { schema });
