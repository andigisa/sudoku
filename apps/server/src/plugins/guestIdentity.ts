import fp from "fastify-plugin";
import { randomBytes } from "node:crypto";
import { db } from "../db/index.js";
import { guests } from "../db/schema.js";
import { eq } from "drizzle-orm";

declare module "fastify" {
  interface FastifyRequest {
    guestId: string;
  }
}

export default fp(
  async (app) => {
    app.decorateRequest("guestId", "");

    app.addHook("preHandler", async (request, reply) => {
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
  },
  { name: "guest-identity", dependencies: ["@fastify/cookie"] }
);
