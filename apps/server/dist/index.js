import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import { difficultySchema, hintRequestSchema } from "@sudoku/contracts";
import { getRandomPuzzle, getPuzzleById } from "./puzzles.js";
import { env } from "./env.js";
import { initDatabase, persist } from "./db/index.js";
import guestIdentityPlugin from "./plugins/guestIdentity.js";
import csrfPlugin from "./plugins/csrf.js";
import rateLimiterPlugin from "./plugins/rateLimiter.js";
import { sessionRoutes } from "./routes/sessions.js";
import { dailyRoutes } from "./routes/daily.js";
import { telemetryRoutes } from "./routes/telemetry.js";
import { tournamentRoutes } from "./routes/tournaments.js";
import { leaderboardRoutes } from "./routes/leaderboards.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { syncRoutes } from "./routes/sync.js";
async function main() {
    await initDatabase();
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const rootDir = path.resolve(__dirname, "../../..");
    const webDistDir = path.resolve(rootDir, "apps/web/dist");
    const app = Fastify({
        logger: { level: env.LOG_LEVEL },
        trustProxy: true
    });
    // Persist sql.js database to disk after mutating requests
    const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
    app.addHook("onResponse", async (request) => {
        if (MUTATING.has(request.method))
            persist();
    });
    // Plugins
    await app.register(fastifyCookie, { secret: env.COOKIE_SECRET });
    await app.register(rateLimiterPlugin);
    await app.register(guestIdentityPlugin);
    await app.register(csrfPlugin);
    // Routes
    app.get("/healthz", async () => ({ status: "ok" }));
    app.get("/api/v1/puzzles/random", async (request, reply) => {
        const parsed = difficultySchema.safeParse(request.query.difficulty);
        if (!parsed.success) {
            return reply.status(400).send({
                message: "difficulty must be one of: easy, medium, hard, expert"
            });
        }
        const puzzle = getRandomPuzzle(parsed.data);
        return puzzle;
    });
    app.get("/api/v1/puzzles/:id", async (request, reply) => {
        const { id } = request.params;
        const puzzle = getPuzzleById(id);
        if (!puzzle)
            return reply.status(404).send({ message: "Puzzle not found" });
        return puzzle;
    });
    app.post("/api/v1/puzzles/:id/hint", async (request, reply) => {
        const { id } = request.params;
        const puzzle = getPuzzleById(id);
        if (!puzzle)
            return reply.status(404).send({ message: "Puzzle not found" });
        const parsed = hintRequestSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ message: "Invalid request" });
        const value = Number(puzzle.solution[parsed.data.cell_index]);
        return { cell_index: parsed.data.cell_index, value };
    });
    await app.register(sessionRoutes);
    await app.register(dailyRoutes);
    await app.register(telemetryRoutes);
    await app.register(tournamentRoutes);
    await app.register(leaderboardRoutes);
    await app.register(adminRoutes);
    await app.register(authRoutes);
    await app.register(syncRoutes);
    if (env.NODE_ENV === "production") {
        await app.register(fastifyStatic, { root: webDistDir, wildcard: false });
        app.setNotFoundHandler(async (request, reply) => {
            if (request.url.startsWith("/admin")) {
                return reply.sendFile("admin.html");
            }
            return reply.sendFile("index.html");
        });
    }
    app
        .listen({ port: env.PORT, host: env.HOST })
        .then(() => {
        app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
    })
        .catch((error) => {
        app.log.error(error);
        process.exit(1);
    });
}
main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map