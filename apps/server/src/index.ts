import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { difficultySchema, puzzleResponseSchema } from "@sudoku/contracts";
import { getRandomPuzzle } from "./puzzles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");
const webDistDir = path.resolve(rootDir, "apps/web/dist");

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info"
  }
});

app.get("/healthz", async () => ({ status: "ok" }));

app.get("/api/v1/puzzles/random", async (request, reply) => {
  const parsed = difficultySchema.safeParse((request.query as { difficulty?: string }).difficulty);

  if (!parsed.success) {
    return reply.status(400).send({
      message: "difficulty must be one of: easy, medium, hard, expert"
    });
  }

  const puzzle = getRandomPuzzle(parsed.data);
  return puzzleResponseSchema.parse(puzzle);
});

if (process.env.NODE_ENV === "production") {
  await app.register(fastifyStatic, {
    root: webDistDir
  });

  app.get("/*", async (_request, reply) => reply.sendFile("index.html"));
}

const port = Number(process.env.PORT ?? 3002);
const host = process.env.HOST ?? "0.0.0.0";

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`Server listening on http://${host}:${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
