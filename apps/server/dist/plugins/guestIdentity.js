import fp from "fastify-plugin";
import { randomBytes } from "node:crypto";
import { db } from "../db/index.js";
import { guests, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { validateAuthSession } from "../services/sessionManager.js";
export default fp(async (app) => {
    app.decorateRequest("guestId", "");
    app.decorateRequest("userId", null);
    app.decorateRequest("isAuthenticated", false);
    app.addHook("preHandler", async (request, reply) => {
        // 1. Check for authenticated session via `sid` cookie
        const sidRaw = request.cookies["sid"];
        if (sidRaw) {
            const unsigned = request.unsignCookie(sidRaw);
            if (unsigned.valid && unsigned.value) {
                const session = validateAuthSession(unsigned.value);
                if (session.valid && session.userId) {
                    request.userId = session.userId;
                    request.isAuthenticated = true;
                    // Look up the user's original guest_id for backward compatibility
                    const user = db.select().from(users).where(eq(users.id, session.userId)).get();
                    if (user?.guestId) {
                        request.guestId = user.guestId;
                        return;
                    }
                }
            }
        }
        // 2. Fall through to guest identity via `gid` cookie
        request.userId = null;
        request.isAuthenticated = false;
        const raw = request.cookies["gid"];
        if (raw) {
            const unsigned = request.unsignCookie(raw);
            if (unsigned.valid && unsigned.value) {
                const guest = db.select().from(guests).where(eq(guests.guestId, unsigned.value)).get();
                if (guest) {
                    request.guestId = unsigned.value;
                    return;
                }
            }
        }
        const guestId = randomBytes(32).toString("hex");
        db.insert(guests).values({ guestId, createdAt: new Date().toISOString() }).run();
        reply.setCookie("gid", guestId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            signed: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 365
        });
        request.guestId = guestId;
    });
}, { name: "guest-identity", dependencies: ["@fastify/cookie"] });
//# sourceMappingURL=guestIdentity.js.map