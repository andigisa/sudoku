import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import guestIdentityPlugin from "../plugins/guestIdentity.js";
import { authRoutes } from "./auth.js";
import { sessionRoutes } from "./sessions.js";
import { db } from "../db/index.js";
import { gameSessions } from "../db/schema.js";
import { eq } from "drizzle-orm";

// Use low Argon2 cost for fast tests
process.env.ARGON2_MEMORY_COST = "1024";
process.env.ARGON2_TIME_COST = "1";

let emailCounter = 0;
function uniqueEmail() {
  return `test-${Date.now()}-${++emailCounter}@example.com`;
}

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(fastifyCookie, { secret: "test-secret" });
  await app.register(guestIdentityPlugin);
  await app.register(sessionRoutes);
  await app.register(authRoutes);
  return app;
}

function extractCookies(headers: Record<string, unknown>): string {
  const raw = headers["set-cookie"];
  if (!raw) return "";
  const vals = Array.isArray(raw) ? raw as string[] : [String(raw)];
  return vals.map((v) => v.split(";")[0]).join("; ");
}

function extractCookie(headers: Record<string, unknown>, name: string): string {
  const raw = headers["set-cookie"];
  if (!raw) return "";
  const vals = Array.isArray(raw) ? raw : [raw];
  const match = vals.find((v) => v.startsWith(`${name}=`));
  return match ? match.split(";")[0] : "";
}

describe("Auth routes", () => {
  it("registers a new user and returns profile", async () => {
    const app = await buildApp();
    const email = uniqueEmail();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password123", display_name: "TestUser" }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBe(email);
    expect(body.user.display_name).toBe("TestUser");

    // Should set sid cookie
    const sid = extractCookie(res.headers, "sid");
    expect(sid).toContain("sid=");
  });

  it("rejects duplicate email with 409", async () => {
    const app = await buildApp();
    const email = uniqueEmail();

    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password123" }
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password456" }
    });

    expect(res.statusCode).toBe(409);
  });

  it("rejects short password with 400", async () => {
    const app = await buildApp();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email: uniqueEmail(), password: "short" }
    });

    expect(res.statusCode).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    const app = await buildApp();
    const email = uniqueEmail();

    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password123" }
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password123" }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).user.email).toBe(email);
    const sid = extractCookie(res.headers, "sid");
    expect(sid).toContain("sid=");
  });

  it("rejects login with wrong password", async () => {
    const app = await buildApp();
    const email = uniqueEmail();

    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password123" }
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { "content-type": "application/json" },
      payload: { email, password: "wrongpassword" }
    });

    expect(res.statusCode).toBe(401);
  });

  it("GET /me returns profile when authenticated", async () => {
    const app = await buildApp();
    const email = uniqueEmail();

    const regRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password123" }
    });

    const cookies = extractCookies(regRes.headers);

    const meRes = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: cookies }
    });

    expect(meRes.statusCode).toBe(200);
    expect(JSON.parse(meRes.body).user.email).toBe(email);
  });

  it("GET /me returns 401 when not authenticated", async () => {
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me"
    });

    expect(res.statusCode).toBe(401);
  });

  it("logout revokes session", async () => {
    const app = await buildApp();
    const email = uniqueEmail();

    const regRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password123" }
    });

    const cookies = extractCookies(regRes.headers);

    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie: cookies }
    });
    expect(logoutRes.statusCode).toBe(204);

    // me should now fail
    const meRes = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: cookies }
    });
    expect(meRes.statusCode).toBe(401);
  });

  it("guest upgrade migrates session data to user", async () => {
    const app = await buildApp();
    const email = uniqueEmail();

    // 1. Create a game session as guest
    const sessionRes = await app.inject({
      method: "POST",
      url: "/api/v1/sessions",
      headers: { "content-type": "application/json" },
      payload: { puzzle_id: "easy-001", difficulty: "easy", state_json: "{}" }
    });
    expect(sessionRes.statusCode).toBe(200);
    const { session_id } = JSON.parse(sessionRes.body);
    const guestCookies = extractCookies(sessionRes.headers);

    // Verify session has no user_id
    let session = db.select().from(gameSessions).where(eq(gameSessions.sessionId, session_id)).get();
    expect(session!.userId).toBeNull();

    // 2. Register (upgrades guest)
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json", cookie: guestCookies },
      payload: { email, password: "password123" }
    });

    // 3. Verify session now has user_id
    session = db.select().from(gameSessions).where(eq(gameSessions.sessionId, session_id)).get();
    expect(session!.userId).toBeTruthy();
  });

  it("updates display name", async () => {
    const app = await buildApp();
    const email = uniqueEmail();

    const regRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password: "password123" }
    });
    const cookies = extractCookies(regRes.headers);

    const updateRes = await app.inject({
      method: "PUT",
      url: "/api/v1/auth/profile",
      headers: { "content-type": "application/json", cookie: cookies },
      payload: { display_name: "NewName" }
    });

    expect(updateRes.statusCode).toBe(200);
    expect(JSON.parse(updateRes.body).display_name).toBe("NewName");
  });
});
