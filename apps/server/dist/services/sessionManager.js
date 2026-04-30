import { randomBytes } from "node:crypto";
import { eq, and, lt, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { userSessions } from "../db/schema.js";
export function createAuthSession(userId, ttlDays) {
    const sessionId = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    db.insert(userSessions)
        .values({
        id: sessionId,
        userId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        revokedAt: null
    })
        .run();
    return { sessionId, expiresAt: expiresAt.toISOString() };
}
export function validateAuthSession(sessionId) {
    const session = db
        .select()
        .from(userSessions)
        .where(and(eq(userSessions.id, sessionId), isNull(userSessions.revokedAt)))
        .get();
    if (!session)
        return { valid: false };
    if (new Date(session.expiresAt) < new Date()) {
        return { valid: false };
    }
    return { valid: true, userId: session.userId };
}
export function revokeAuthSession(sessionId) {
    db.update(userSessions)
        .set({ revokedAt: new Date().toISOString() })
        .where(eq(userSessions.id, sessionId))
        .run();
}
export function cleanupExpiredSessions(userId) {
    db.delete(userSessions)
        .where(and(eq(userSessions.userId, userId), lt(userSessions.expiresAt, new Date().toISOString())))
        .run();
}
//# sourceMappingURL=sessionManager.js.map