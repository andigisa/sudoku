import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import guestIdentityPlugin from "../plugins/guestIdentity.js";
import { tournamentRoutes } from "./tournaments.js";
import { adminRoutes } from "./admin.js";
import { leaderboardRoutes } from "./leaderboards.js";
import { sessionRoutes } from "./sessions.js";

// A valid fully-solved Sudoku board (no conflicts, all 1-9)
const SOLVED_BOARD = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
const MEDIUM_PUZZLE_ID = "medium-001";

let slugCounter = 0;

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(fastifyCookie, { secret: "test-secret" });
  await app.register(guestIdentityPlugin);
  await app.register(sessionRoutes);
  await app.register(tournamentRoutes);
  await app.register(adminRoutes);
  await app.register(leaderboardRoutes);
  return app;
}

/** Extract the Set-Cookie header value from an inject response for reuse */
function extractCookie(headers: Record<string, string | string[]>): string {
  const raw = headers["set-cookie"];
  if (!raw) return "";
  const val = Array.isArray(raw) ? raw[0] : raw;
  return val.split(";")[0]; // just the name=value part
}

async function createActiveTournament(app: Awaited<ReturnType<typeof buildApp>>) {
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const slug = `test-${Date.now()}-${++slugCounter}`;

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/admin/tournaments",
    headers: { authorization: "Bearer dev-admin-secret", "content-type": "application/json" },
    payload: { slug, title: "Test Tournament", starts_at: past, ends_at: future, puzzle_id: MEDIUM_PUZZLE_ID }
  });
  expect(res.statusCode).toBe(201);
  return JSON.parse(res.body) as { id: string };
}

/** Creates a session as a named guest and returns { session_id, cookie } */
async function createSession(app: Awaited<ReturnType<typeof buildApp>>) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/sessions",
    headers: { "content-type": "application/json" },
    payload: { puzzle_id: MEDIUM_PUZZLE_ID, difficulty: "medium", state_json: "{}" }
  });
  expect(res.statusCode).toBe(200);
  return {
    session_id: (JSON.parse(res.body) as { session_id: string }).session_id,
    cookie: extractCookie(res.headers as Record<string, string | string[]>)
  };
}

describe("Tournament routes", () => {
  it("GET /api/v1/tournaments/current → 404 when no tournament exists", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/v1/tournaments/current" });
    expect(res.statusCode).toBe(404);
  });

  it("POST admin creates tournament; GET current returns it", async () => {
    const app = await buildApp();
    const { id } = await createActiveTournament(app);

    const res = await app.inject({ method: "GET", url: "/api/v1/tournaments/current" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(id);
    expect(body.status).toBe("active");
  });

  it("POST entry with abuse time → 422", async () => {
    const app = await buildApp();
    const { id: tournamentId } = await createActiveTournament(app);
    const { session_id, cookie } = await createSession(app);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/tournaments/${tournamentId}/entries`,
      headers: { "content-type": "application/json", cookie },
      payload: { session_id, elapsed_ms: 1000, mistakes: 0, hints_used: 0, final_board: SOLVED_BOARD }
    });

    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).message).toMatch(/impossible solve/i);
  });

  it("POST valid entry → returns score and rank", async () => {
    const app = await buildApp();
    const { id: tournamentId } = await createActiveTournament(app);
    const { session_id, cookie } = await createSession(app);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/tournaments/${tournamentId}/entries`,
      headers: { "content-type": "application/json", cookie },
      payload: { session_id, elapsed_ms: 120_000, mistakes: 1, hints_used: 0, final_board: SOLVED_BOARD }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.score).toBe(1450);   // 1500 - 50×1
    expect(body.rank).toBe(1);
    expect(body.is_best).toBe(true);
    expect(body.idempotent).toBe(false);
  });

  it("POST same payload twice → idempotent on second call", async () => {
    const app = await buildApp();
    const { id: tournamentId } = await createActiveTournament(app);
    const { session_id, cookie } = await createSession(app);
    const payload = { session_id, elapsed_ms: 200_000, mistakes: 0, hints_used: 0, final_board: SOLVED_BOARD };
    const headers = { "content-type": "application/json", cookie };

    const first = await app.inject({ method: "POST", url: `/api/v1/tournaments/${tournamentId}/entries`, headers, payload });
    const second = await app.inject({ method: "POST", url: `/api/v1/tournaments/${tournamentId}/entries`, headers, payload });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(JSON.parse(second.body).idempotent).toBe(true);
    expect(JSON.parse(second.body).entry_id).toBe(JSON.parse(first.body).entry_id);
  });

  it("best-attempt: higher-score second entry wins on leaderboard", async () => {
    const app = await buildApp();
    const { id: tournamentId } = await createActiveTournament(app);
    const { session_id, cookie } = await createSession(app);
    const headers = { "content-type": "application/json", cookie };

    const first = await app.inject({
      method: "POST", url: `/api/v1/tournaments/${tournamentId}/entries`, headers,
      payload: { session_id, elapsed_ms: 200_000, mistakes: 2, hints_used: 0, final_board: SOLVED_BOARD }
    });
    expect(JSON.parse(first.body).score).toBe(1400); // 1500 - 100

    const second = await app.inject({
      method: "POST", url: `/api/v1/tournaments/${tournamentId}/entries`, headers,
      payload: { session_id, elapsed_ms: 200_001, mistakes: 0, hints_used: 0, final_board: SOLVED_BOARD }
    });
    expect(JSON.parse(second.body).score).toBe(1500);
    expect(JSON.parse(second.body).is_best).toBe(true);

    const lb = await app.inject({ method: "GET", url: `/api/v1/leaderboards/tournament/${tournamentId}` });
    expect(JSON.parse(lb.body).entries[0].score).toBe(1500);
  });

  it("GET leaderboard returns ranked entries with display name", async () => {
    const app = await buildApp();
    const { id: tournamentId } = await createActiveTournament(app);
    const { session_id, cookie } = await createSession(app);

    await app.inject({
      method: "POST", url: `/api/v1/tournaments/${tournamentId}/entries`,
      headers: { "content-type": "application/json", cookie },
      payload: { session_id, elapsed_ms: 150_000, mistakes: 0, hints_used: 0, final_board: SOLVED_BOARD }
    });

    const res = await app.inject({ method: "GET", url: `/api/v1/leaderboards/tournament/${tournamentId}` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(1);
    expect(body.entries[0].rank).toBe(1);
    expect(body.entries[0].score).toBe(1500);
    expect(body.entries[0].display_name).toMatch(/^Guest #/);
  });
});
