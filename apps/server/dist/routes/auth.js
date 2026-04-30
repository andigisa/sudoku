import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, passwordCredentials, syncStates } from "../db/schema.js";
import { env } from "../env.js";
import { registerRequestSchema, loginRequestSchema, updateProfileRequestSchema, passwordResetRequestSchema, authResponseSchema, userProfileSchema } from "@sudoku/contracts";
import { validatePasswordPolicy, hashPassword, verifyPassword } from "../services/auth.js";
import { createAuthSession, revokeAuthSession, cleanupExpiredSessions } from "../services/sessionManager.js";
import { upgradeGuestToUser } from "../services/guestUpgrade.js";
function setSessionCookie(reply, sessionId) {
    reply.setCookie("sid", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        signed: true,
        path: "/",
        maxAge: env.AUTH_SESSION_TTL_DAYS * 24 * 60 * 60
    });
}
export async function authRoutes(app) {
    // ── Register ────────────────────────────────────────────────────────────────
    app.post("/api/v1/auth/register", {
        config: { rateLimit: { max: 5, timeWindow: "1 minute" } }
    }, async (request, reply) => {
        const parsed = registerRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ message: "Invalid request body" });
        }
        const { email, password, display_name } = parsed.data;
        const policy = validatePasswordPolicy(password);
        if (!policy.valid) {
            return reply.status(400).send({ message: policy.reason });
        }
        // Check email uniqueness
        const existing = db.select().from(users).where(eq(users.email, email)).get();
        if (existing) {
            return reply.status(409).send({ message: "Email already registered" });
        }
        const userId = randomUUID();
        const now = new Date().toISOString();
        const hash = await hashPassword(password, env.ARGON2_MEMORY_COST, env.ARGON2_TIME_COST);
        db.transaction((tx) => {
            tx.insert(users)
                .values({
                id: userId,
                email,
                displayName: display_name ?? null,
                guestId: request.guestId,
                createdAt: now,
                updatedAt: now
            })
                .run();
            tx.insert(passwordCredentials)
                .values({
                id: randomUUID(),
                userId,
                hash,
                createdAt: now,
                updatedAt: now
            })
                .run();
            tx.insert(syncStates)
                .values({
                userId,
                settingsJson: "{}",
                version: 0,
                updatedAt: now
            })
                .run();
        });
        upgradeGuestToUser(request.guestId, userId);
        const { sessionId } = createAuthSession(userId, env.AUTH_SESSION_TTL_DAYS);
        setSessionCookie(reply, sessionId);
        return authResponseSchema.parse({
            user: { id: userId, email, display_name: display_name ?? null, created_at: now }
        });
    });
    // ── Login ───────────────────────────────────────────────────────────────────
    app.post("/api/v1/auth/login", {
        config: { rateLimit: { max: 5, timeWindow: "1 minute" } }
    }, async (request, reply) => {
        const parsed = loginRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ message: "Invalid request body" });
        }
        const { email, password } = parsed.data;
        const user = db.select().from(users).where(eq(users.email, email)).get();
        if (!user) {
            return reply.status(401).send({ message: "Invalid email or password" });
        }
        const cred = db.select().from(passwordCredentials).where(eq(passwordCredentials.userId, user.id)).get();
        if (!cred) {
            return reply.status(401).send({ message: "Invalid email or password" });
        }
        const valid = await verifyPassword(cred.hash, password);
        if (!valid) {
            return reply.status(401).send({ message: "Invalid email or password" });
        }
        cleanupExpiredSessions(user.id);
        // If the current gid belongs to a different guest than the user's original,
        // merge that guest's data too (handles "played as guest on device B, then logged in")
        if (user.guestId && request.guestId !== user.guestId) {
            upgradeGuestToUser(request.guestId, user.id);
        }
        const { sessionId } = createAuthSession(user.id, env.AUTH_SESSION_TTL_DAYS);
        setSessionCookie(reply, sessionId);
        return authResponseSchema.parse({
            user: {
                id: user.id,
                email: user.email,
                display_name: user.displayName,
                created_at: user.createdAt
            }
        });
    });
    // ── Logout ──────────────────────────────────────────────────────────────────
    app.post("/api/v1/auth/logout", async (request, reply) => {
        if (request.isAuthenticated) {
            const sidRaw = request.cookies["sid"];
            if (sidRaw) {
                const unsigned = request.unsignCookie(sidRaw);
                if (unsigned.valid && unsigned.value) {
                    revokeAuthSession(unsigned.value);
                }
            }
        }
        reply.clearCookie("sid", { path: "/" });
        return reply.status(204).send();
    });
    // ── Me ──────────────────────────────────────────────────────────────────────
    app.get("/api/v1/auth/me", async (request, reply) => {
        if (!request.isAuthenticated || !request.userId) {
            return reply.status(401).send({ message: "Not authenticated" });
        }
        const user = db.select().from(users).where(eq(users.id, request.userId)).get();
        if (!user) {
            return reply.status(401).send({ message: "Not authenticated" });
        }
        return authResponseSchema.parse({
            user: {
                id: user.id,
                email: user.email,
                display_name: user.displayName,
                created_at: user.createdAt
            }
        });
    });
    // ── Update Profile ──────────────────────────────────────────────────────────
    app.put("/api/v1/auth/profile", async (request, reply) => {
        if (!request.isAuthenticated || !request.userId) {
            return reply.status(401).send({ message: "Not authenticated" });
        }
        const parsed = updateProfileRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ message: "Invalid request body" });
        }
        const now = new Date().toISOString();
        db.update(users)
            .set({ displayName: parsed.data.display_name ?? null, updatedAt: now })
            .where(eq(users.id, request.userId))
            .run();
        const user = db.select().from(users).where(eq(users.id, request.userId)).get();
        return userProfileSchema.parse({
            id: user.id,
            email: user.email,
            display_name: user.displayName,
            created_at: user.createdAt
        });
    });
    // ── Password Reset (placeholder) ───────────────────────────────────────────
    app.post("/api/v1/auth/reset-password", async (request, reply) => {
        const parsed = passwordResetRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ message: "Invalid request body" });
        }
        app.log.info({ email: parsed.data.email }, "Password reset requested (not implemented)");
        return { message: "If an account exists with that email, a reset link has been sent." };
    });
}
//# sourceMappingURL=auth.js.map