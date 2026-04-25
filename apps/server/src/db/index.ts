import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";
import { drizzle, type SQLJsDatabase } from "drizzle-orm/sql-js";
import { env } from "../env.js";
import * as schema from "./schema.js";

const isMemory = env.DB_PATH === ":memory:";
const dbPath = isMemory ? ":memory:" : path.resolve(env.DB_PATH);
if (!isMemory) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

// Mutable module-level state — set once by initDatabase(), then used by all importers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: SQLJsDatabase<typeof schema> = undefined as any;
let persistFn: () => void = () => {};

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  // Load existing DB file if present, otherwise create empty
  const sqlite = (!isMemory && fs.existsSync(dbPath))
    ? new SQL.Database(fs.readFileSync(dbPath))
    : new SQL.Database();

  // sql.js is in-memory — persist to disk after writes (skip for :memory: test DBs)
  persistFn = isMemory ? () => {} : () => {
    const data = sqlite.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  };

  sqlite.run("PRAGMA foreign_keys = ON");

  sqlite.run(`
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

    -- Auth tables
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT,
      guest_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_credential (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      user_id TEXT PRIMARY KEY,
      settings_json TEXT NOT NULL DEFAULT '{}',
      version INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
    CREATE INDEX IF NOT EXISTS idx_user_guest_id ON user(guest_id);
    CREATE INDEX IF NOT EXISTS idx_password_credential_user_id ON password_credential(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON user_session(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_session_expires_at ON user_session(expires_at);
  `);

  // Migrations: add user_id column to existing tables
  const migrationTables = ["game_sessions", "tournament_entry", "leaderboard_snapshot", "abuse_flag"];
  for (const table of migrationTables) {
    const columns = sqlite.exec(`PRAGMA table_info(${table})`);
    const names = columns.length > 0 ? columns[0].values.map((row) => row[1] as string) : [];
    if (!names.includes("user_id")) {
      sqlite.run(`ALTER TABLE ${table} ADD COLUMN user_id TEXT`);
    }
  }

  sqlite.run(`
    CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_tournament_entry_user_id ON tournament_entry(user_id);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshot_user_id ON leaderboard_snapshot(user_id);
  `);

  persistFn();

  db = drizzle(sqlite, { schema });
}

export function persist(): void {
  persistFn();
}

export { db };
