import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { tournaments } from "../db/schema.js";
import { getPuzzleById } from "../puzzles.js";
import { env } from "../env.js";
import { createTournamentRequestSchema, tournamentResponseSchema } from "@sudoku/contracts";
import { resolveStatus } from "../services/tournament.js";

export async function adminRoutes(app: FastifyInstance) {
  app.post("/api/v1/admin/tournaments", async (request, reply) => {
    const authHeader = (request.headers["authorization"] as string | undefined) ?? "";
    if (authHeader !== `Bearer ${env.ADMIN_SECRET}`) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = createTournamentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Invalid request body" });
    }

    const { slug, title, starts_at, ends_at, puzzle_id } = parsed.data;

    if (new Date(starts_at) >= new Date(ends_at)) {
      return reply.status(400).send({ message: "starts_at must be before ends_at" });
    }

    if (!getPuzzleById(puzzle_id)) {
      return reply.status(400).send({ message: `Unknown puzzle_id: ${puzzle_id}` });
    }

    const id = randomUUID();
    const status = resolveStatus({ startsAt: starts_at, endsAt: ends_at });

    db.insert(tournaments)
      .values({ id, slug, title, startsAt: starts_at, endsAt: ends_at, puzzleId: puzzle_id, rulesetVersion: env.TOURNAMENT_RULESET_VERSION, status })
      .run();

    app.log.info({ tournamentId: id, slug }, "tournament created");

    return reply.status(201).send(
      tournamentResponseSchema.parse({
        id,
        slug,
        title,
        starts_at,
        ends_at,
        puzzle_id,
        ruleset_version: env.TOURNAMENT_RULESET_VERSION,
        status
      })
    );
  });
}
