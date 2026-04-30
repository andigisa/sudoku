import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { guests, gameSessions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { upgradeGuestToUser } from "./guestUpgrade.js";
function seedGuest(guestId) {
    db.insert(guests).values({ guestId, createdAt: new Date().toISOString() }).run();
}
function seedSession(guestId, userId = null) {
    const id = randomUUID();
    db.insert(gameSessions)
        .values({
        sessionId: id,
        guestId,
        userId,
        puzzleId: "easy-001",
        difficulty: "easy",
        stateJson: "{}",
        startedAt: new Date().toISOString(),
        elapsedMs: 0,
        mistakes: 0
    })
        .run();
    return id;
}
describe("upgradeGuestToUser", () => {
    it("sets user_id on all guest-owned sessions", () => {
        const guestId = randomUUID();
        const userId = randomUUID();
        seedGuest(guestId);
        const sid = seedSession(guestId);
        upgradeGuestToUser(guestId, userId);
        const session = db.select().from(gameSessions).where(eq(gameSessions.sessionId, sid)).get();
        expect(session.userId).toBe(userId);
    });
    it("is idempotent — running twice does not error or duplicate", () => {
        const guestId = randomUUID();
        const userId = randomUUID();
        seedGuest(guestId);
        seedSession(guestId);
        upgradeGuestToUser(guestId, userId);
        upgradeGuestToUser(guestId, userId);
        const sessions = db.select().from(gameSessions).where(eq(gameSessions.guestId, guestId)).all();
        expect(sessions.length).toBe(1);
        expect(sessions[0].userId).toBe(userId);
    });
    it("does not overwrite rows already assigned to a different user", () => {
        const guestId = randomUUID();
        const userId1 = randomUUID();
        const userId2 = randomUUID();
        seedGuest(guestId);
        const sid = seedSession(guestId, userId1); // already owned by userId1
        upgradeGuestToUser(guestId, userId2);
        const session = db.select().from(gameSessions).where(eq(gameSessions.sessionId, sid)).get();
        expect(session.userId).toBe(userId1); // unchanged
    });
});
//# sourceMappingURL=guestUpgrade.test.js.map