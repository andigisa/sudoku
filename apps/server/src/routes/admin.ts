import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomUUID, randomBytes, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { tournaments } from "../db/schema.js";
import { getPuzzleById, listAllPuzzleIds } from "../puzzles.js";
import { env } from "../env.js";
import { createTournamentRequestSchema, tournamentResponseSchema } from "@sudoku/contracts";
import { resolveStatus } from "../services/tournament.js";

// In-memory admin sessions (lost on restart — admin just re-logs in)
const adminSessions = new Set<string>();

function requireAdmin(request: FastifyRequest, reply: FastifyReply): boolean {
  // Check cookie-based session
  const cookieVal = request.cookies.admin_sid;
  if (cookieVal) {
    const unsigned = request.unsignCookie(cookieVal);
    if (unsigned.valid && unsigned.value && adminSessions.has(unsigned.value)) {
      return true;
    }
  }

  // Check bearer token (backward compat for curl)
  const authHeader = (request.headers["authorization"] as string | undefined) ?? "";
  if (authHeader === `Bearer ${env.ADMIN_SECRET}`) {
    return true;
  }

  reply.status(401).send({ message: "Unauthorized" });
  return false;
}

export async function adminRoutes(app: FastifyInstance) {
  // ── Auth ──────────────────────────────────────────────────────────────────

  app.post("/api/v1/admin/login", async (request, reply) => {
    const body = request.body as { password?: string } | undefined;
    if (!body?.password) {
      return reply.status(400).send({ message: "Password required" });
    }

    const input = Buffer.from(body.password);
    const secret = Buffer.from(env.ADMIN_SECRET);
    const match = input.length === secret.length && timingSafeEqual(input, secret);

    if (!match) {
      return reply.status(401).send({ message: "Invalid password" });
    }

    const token = randomBytes(32).toString("hex");
    adminSessions.add(token);

    reply.setCookie("admin_sid", token, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      signed: true,
      secure: env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 // 8 hours
    });

    return { authenticated: true };
  });

  app.post("/api/v1/admin/logout", async (request, reply) => {
    const cookieVal = request.cookies.admin_sid;
    if (cookieVal) {
      const unsigned = request.unsignCookie(cookieVal);
      if (unsigned.valid && unsigned.value) {
        adminSessions.delete(unsigned.value);
      }
    }
    reply.clearCookie("admin_sid", { path: "/" });
    return { authenticated: false };
  });

  app.get("/api/v1/admin/me", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return { authenticated: true };
  });

  // ── Tournaments ───────────────────────────────────────────────────────────

  app.get("/api/v1/admin/tournaments", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;

    const rows = db.all(sql`SELECT * FROM tournament ORDER BY starts_at DESC`);
    return (rows as Array<Record<string, unknown>>).map((row) => {
      const status = resolveStatus({ startsAt: row.starts_at as string, endsAt: row.ends_at as string });
      return tournamentResponseSchema.parse({
        id: row.id,
        slug: row.slug,
        title: row.title,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        puzzle_id: row.puzzle_id,
        ruleset_version: row.ruleset_version,
        status
      });
    });
  });

  app.post("/api/v1/admin/tournaments", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;

    const parsed = createTournamentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Invalid request body" });
    }

    const { slug, title, starts_at, ends_at, puzzle_id } = parsed.data;

    if (new Date(starts_at) >= new Date(ends_at)) {
      return reply.status(400).send({ message: "starts_at must be before ends_at" });
    }

    if (!getPuzzleById(puzzle_id)) {
      return reply.status(400).send({ message: `Unknown puzzle_id: ${puzzle_id}` });
    }

    const id = randomUUID();
    const status = resolveStatus({ startsAt: starts_at, endsAt: ends_at });

    db.insert(tournaments)
      .values({ id, slug, title, startsAt: starts_at, endsAt: ends_at, puzzleId: puzzle_id, rulesetVersion: env.TOURNAMENT_RULESET_VERSION, status })
      .run();

    app.log.info({ tournamentId: id, slug }, "tournament created");

    return reply.status(201).send(
      tournamentResponseSchema.parse({
        id,
        slug,
        title,
        starts_at,
        ends_at,
        puzzle_id,
        ruleset_version: env.TOURNAMENT_RULESET_VERSION,
        status
      })
    );
  });

  app.get("/api/v1/admin/puzzles", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return listAllPuzzleIds();
  });

  // ── Users ─────────────────────────────────────────────────────────────────

  app.get("/api/v1/admin/users", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;

    const rows = db.all(sql`
      SELECT
        u.id,
        u.email,
        u.display_name,
        u.guest_id,
        u.created_at,
        COALESCE(gs.total_games, 0) as total_games,
        COALESCE(gs.completed_games, 0) as completed_games,
        COALESCE(gs.total_elapsed_ms, 0) as total_elapsed_ms,
        gs.last_active
      FROM user u
      LEFT JOIN (
        SELECT
          COALESCE(user_id, guest_id) as player_id,
          COUNT(*) as total_games,
          SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed_games,
          SUM(elapsed_ms) as total_elapsed_ms,
          MAX(started_at) as last_active
        FROM game_sessions
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      ) gs ON gs.player_id = u.id
      ORDER BY u.created_at DESC
    `) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: row.id as string,
      email: row.email as string,
      displayName: row.display_name as string | null,
      guestId: row.guest_id as string | null,
      createdAt: row.created_at as string,
      totalGames: row.total_games as number,
      completedGames: row.completed_games as number,
      totalElapsedMs: row.total_elapsed_ms as number,
      lastActive: (row.last_active as string | null) ?? (row.created_at as string)
    }));
  });

  app.get("/api/v1/admin/guests", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;

    const rows = db.all(sql`
      SELECT
        g.guest_id,
        g.created_at,
        COALESCE(gs.total_games, 0) as total_games,
        COALESCE(gs.completed_games, 0) as completed_games,
        gs.last_active,
        CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as has_account
      FROM guests g
      LEFT JOIN (
        SELECT
          guest_id,
          COUNT(*) as total_games,
          SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed_games,
          MAX(started_at) as last_active
        FROM game_sessions
        GROUP BY guest_id
      ) gs ON gs.guest_id = g.guest_id
      LEFT JOIN user u ON u.guest_id = g.guest_id
      ORDER BY g.created_at DESC
      LIMIT 200
    `) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      guestId: row.guest_id as string,
      createdAt: row.created_at as string,
      totalGames: row.total_games as number,
      completedGames: row.completed_games as number,
      lastActive: (row.last_active as string | null) ?? (row.created_at as string),
      hasAccount: (row.has_account as number) === 1
    }));
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  app.get("/api/v1/admin/stats", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;

    const todayStart = new Date().toISOString().slice(0, 10) + "T00:00:00";
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Guest stats
    const totalGuests = (db.get(sql`SELECT COUNT(*) as c FROM guests`) as { c: number }).c;
    const guestsToday = (db.get(sql`SELECT COUNT(*) as c FROM guests WHERE created_at >= ${todayStart}`) as { c: number }).c;
    const returningGuests = (db.get(
      sql`SELECT COUNT(*) as c FROM (SELECT guest_id FROM game_sessions GROUP BY guest_id HAVING COUNT(*) > 1)`
    ) as { c: number }).c;

    // User stats
    const totalUsers = (db.get(sql`SELECT COUNT(*) as c FROM user`) as { c: number }).c;
    const usersToday = (db.get(sql`SELECT COUNT(*) as c FROM user WHERE created_at >= ${todayStart}`) as { c: number }).c;

    // Session stats
    const totalSessions = (db.get(sql`SELECT COUNT(*) as c FROM game_sessions`) as { c: number }).c;
    const completedSessions = (db.get(sql`SELECT COUNT(*) as c FROM game_sessions WHERE completed_at IS NOT NULL`) as { c: number }).c;
    const sessionsToday = (db.get(sql`SELECT COUNT(*) as c FROM game_sessions WHERE started_at >= ${todayStart}`) as { c: number }).c;
    const avgCompletion = (db.get(sql`SELECT AVG(elapsed_ms) as avg FROM game_sessions WHERE completed_at IS NOT NULL`) as { avg: number | null }).avg;

    const byDifficulty = db.all(
      sql`SELECT difficulty, COUNT(*) as count FROM game_sessions GROUP BY difficulty ORDER BY difficulty`
    ) as Array<{ difficulty: string; count: number }>;

    // Active auth sessions
    const now = new Date().toISOString();
    const activeSessions = (db.get(
      sql`SELECT COUNT(*) as c FROM user_session WHERE expires_at > ${now} AND revoked_at IS NULL`
    ) as { c: number }).c;

    // Tournament stats
    const totalTournaments = (db.get(sql`SELECT COUNT(*) as c FROM tournament`) as { c: number }).c;
    const totalEntries = (db.get(sql`SELECT COUNT(*) as c FROM tournament_entry`) as { c: number }).c;
    const totalAbuseFlags = (db.get(sql`SELECT COUNT(*) as c FROM abuse_flag`) as { c: number }).c;

    // Trends (last 30 days)
    const guestsPerDay = db.all(
      sql`SELECT SUBSTR(created_at, 1, 10) as date, COUNT(*) as count FROM guests WHERE SUBSTR(created_at, 1, 10) >= ${thirtyDaysAgo} GROUP BY SUBSTR(created_at, 1, 10) ORDER BY date`
    ) as Array<{ date: string; count: number }>;

    const gamesPerDay = db.all(
      sql`SELECT SUBSTR(started_at, 1, 10) as date, COUNT(*) as count FROM game_sessions WHERE SUBSTR(started_at, 1, 10) >= ${thirtyDaysAgo} GROUP BY SUBSTR(started_at, 1, 10) ORDER BY date`
    ) as Array<{ date: string; count: number }>;

    const registrationsPerDay = db.all(
      sql`SELECT SUBSTR(created_at, 1, 10) as date, COUNT(*) as count FROM user WHERE SUBSTR(created_at, 1, 10) >= ${thirtyDaysAgo} GROUP BY SUBSTR(created_at, 1, 10) ORDER BY date`
    ) as Array<{ date: string; count: number }>;

    return {
      guests: { total: totalGuests, today: guestsToday, returning: returningGuests },
      users: { total: totalUsers, today: usersToday },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        today: sessionsToday,
        avgCompletionMs: avgCompletion ? Math.round(avgCompletion) : null,
        byDifficulty
      },
      activeSessions,
      tournaments: { total: totalTournaments, entriesTotal: totalEntries, abuseFlagsTotal: totalAbuseFlags },
      trends: { guestsPerDay, gamesPerDay, registrationsPerDay }
    };
  });
}
