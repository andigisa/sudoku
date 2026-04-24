import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import guestIdentityPlugin from "../plugins/guestIdentity.js";
import { authRoutes } from "./auth.js";
import { sessionRoutes } from "./sessions.js";
import { syncRoutes } from "./sync.js";

process.env.ARGON2_MEMORY_COST = "1024";
process.env.ARGON2_TIME_COST = "1";

let emailCounter = 0;
function uniqueEmail() {
  return `sync-${Date.now()}-${++emailCounter}@example.com`;
}

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(fastifyCookie, { secret: "test-secret" });
  await app.register(guestIdentityPlugin);
  await app.register(sessionRoutes);
  await app.register(authRoutes);
  await app.register(syncRoutes);
  return app;
}

function extractCookies(headers: Record<string, unknown>): string {
  const raw = headers["set-cookie"];
  if (!raw) return "";
  const vals = Array.isArray(raw) ? raw as string[] : [String(raw)];
  return vals.map((v) => v.split(";")[0]).join("; ");
}

async function registerUser(app: Awaited<ReturnType<typeof buildApp>>) {
  const email = uniqueEmail();
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    headers: { "content-type": "application/json" },
    payload: { email, password: "password123" }
  });
  return { cookies: extractCookies(res.headers), email };
}

describe("Sync routes", () => {
  it("bootstrap returns user profile and empty state", async () => {
    const app = await buildApp();
    const { cookies } = await registerUser(app);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sync/bootstrap",
      headers: { cookie: cookies }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBeTruthy();
    expect(body.settings).toEqual({});
    expect(body.sync_version).toBe(0);
    expect(body.recent_sessions).toEqual([]);
    expect(body.in_progress_games).toEqual([]);
  });

  it("bootstrap returns 401 for unauthenticated", async () => {
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sync/bootstrap"
    });

    expect(res.statusCode).toBe(401);
  });

  it("push accepts setting changes and increments version", async () => {
    const app = await buildApp();
    const { cookies } = await registerUser(app);

    const pushRes = await app.inject({
      method: "POST",
      url: "/api/v1/sync/push",
      headers: { "content-type": "application/json", cookie: cookies },
      payload: {
        last_known_version: 0,
        changes: [
          { type: "setting_change", payload: { theme: "dark" }, timestamp: new Date().toISOString() }
        ]
      }
    });

    expect(pushRes.statusCode).toBe(200);
    const pushBody = JSON.parse(pushRes.body);
    expect(pushBody.accepted).toHaveLength(1);
    expect(pushBody.new_version).toBe(1);

    // Re-bootstrap should show updated settings
    const bootRes = await app.inject({
      method: "GET",
      url: "/api/v1/sync/bootstrap",
      headers: { cookie: cookies }
    });
    const bootBody = JSON.parse(bootRes.body);
    expect(bootBody.settings.theme).toBe("dark");
    expect(bootBody.sync_version).toBe(1);
  });

  it("push rejects all changes when version is stale", async () => {
    const app = await buildApp();
    const { cookies } = await registerUser(app);

    // First push to increment version to 1
    await app.inject({
      method: "POST",
      url: "/api/v1/sync/push",
      headers: { "content-type": "application/json", cookie: cookies },
      payload: {
        last_known_version: 0,
        changes: [
          { type: "setting_change", payload: { theme: "dark" }, timestamp: new Date().toISOString() }
        ]
      }
    });

    // Second push with stale version 0
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/sync/push",
      headers: { "content-type": "application/json", cookie: cookies },
      payload: {
        last_known_version: 0,
        changes: [
          { type: "setting_change", payload: { theme: "light" }, timestamp: new Date().toISOString() }
        ]
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.rejected).toHaveLength(1);
    expect(body.rejected[0].reason).toBe("version_conflict");
    expect(body.new_version).toBe(1);
  });

  it("push accepts session updates", async () => {
    const app = await buildApp();
    const { cookies } = await registerUser(app);

    // Create a session with auth cookies (guest identity is preserved)
    const sessionRes = await app.inject({
      method: "POST",
      url: "/api/v1/sessions",
      headers: { "content-type": "application/json", cookie: cookies },
      payload: { puzzle_id: "easy-001", difficulty: "easy", state_json: "{}" }
    });
    const { session_id } = JSON.parse(sessionRes.body);

    const pushRes = await app.inject({
      method: "POST",
      url: "/api/v1/sync/push",
      headers: { "content-type": "application/json", cookie: cookies },
      payload: {
        last_known_version: 0,
        changes: [
          {
            type: "session_update",
            payload: { session_id, elapsed_ms: 5000, mistakes: 1 },
            timestamp: new Date().toISOString()
          }
        ]
      }
    });

    expect(pushRes.statusCode).toBe(200);
    const body = JSON.parse(pushRes.body);
    expect(body.accepted).toHaveLength(1);
    expect(body.new_version).toBe(1);
  });
});
