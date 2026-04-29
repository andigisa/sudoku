import fp from "fastify-plugin";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default fp(
  async (app) => {
    app.addHook("preHandler", async (request, reply) => {
      if (!MUTATING_METHODS.has(request.method)) return;

      // Skip for unauthenticated guests (cookie is SameSite=strict)
      if (!request.isAuthenticated) return;

      // Skip admin routes using bearer token auth (not cookie auth)
      if (request.url.startsWith("/api/v1/admin/") && request.headers.authorization) return;

      const host = request.headers.host;
      if (!host) {
        return reply.status(403).send({ message: "CSRF validation failed" });
      }

      const hostHostname = host.split(":")[0];

      const origin = request.headers.origin;
      if (origin) {
        try {
          const originHostname = new URL(origin).hostname;
          if (originHostname === hostHostname) return;
        } catch {
          // invalid origin URL
        }
        return reply.status(403).send({ message: "CSRF validation failed" });
      }

      const referer = request.headers.referer;
      if (referer) {
        try {
          const refererHostname = new URL(referer).hostname;
          if (refererHostname === hostHostname) return;
        } catch {
          // invalid referer URL
        }
        return reply.status(403).send({ message: "CSRF validation failed" });
      }

      // No Origin or Referer on an authenticated mutating request
      return reply.status(403).send({ message: "CSRF validation failed" });
    });
  },
  { name: "csrf", dependencies: ["guest-identity"] }
);
