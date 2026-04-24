import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { gameSessions } from "../db/schema.js";
import {
  createSessionRequestSchema,
  updateSessionRequestSchema,
  sessionResponseSchema
} from "@sudoku/contracts";

export async function sessionRoutes(app: FastifyInstance) {
  app.post("/api/v1/sessions", async (request, reply) => {
    const parsed = createSessionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Invalid request body" });
    }

    const { puzzle_id, difficulty, state_json } = parsed.data;
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    db.insert(gameSessions)
      .values({
        sessionId,
        guestId: request.guestId,
        puzzleId: puzzle_id,
        difficulty,
        stateJson: state_json,
        startedAt: now,
        completedAt: null,
        elapsedMs: 0,
        mistakes: 0
      })
      .run();

    const session = db.select().from(gameSessions).where(eq(gameSessions.sessionId, sessionId)).get();
    return sessionResponseSchema.parse({
      session_id: session!.sessionId,
      puzzle_id: session!.puzzleId,
      difficulty: session!.difficulty,
      state_json: session!.stateJson,
      started_at: session!.startedAt,
      completed_at: session!.completedAt ?? null,
      elapsed_ms: session!.elapsedMs,
      mistakes: session!.mistakes
    });
  });

  app.get<{ Params: { id: string } }>("/api/v1/sessions/:id", async (request, reply) => {
    const session = db
      .select()
      .from(gameSessions)
      .where(
        and(
          eq(gameSessions.sessionId, request.params.id),
          eq(gameSessions.guestId, request.guestId)
        )
      )
      .get();

    if (!session) {
      return reply.status(404).send({ message: "Session not found" });
    }

    return sessionResponseSchema.parse({
      session_id: session.sessionId,
      puzzle_id: session.puzzleId,
      difficulty: session.difficulty,
      state_json: session.stateJson,
      started_at: session.startedAt,
      completed_at: session.completedAt ?? null,
      elapsed_ms: session.elapsedMs,
      mistakes: session.mistakes
    });
  });

  app.put<{ Params: { id: string } }>("/api/v1/sessions/:id", async (request, reply) => {
    const parsed = updateSessionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Invalid request body" });
    }

    const existing = db
      .select()
      .from(gameSessions)
      .where(
        and(
          eq(gameSessions.sessionId, request.params.id),
          eq(gameSessions.guestId, request.guestId)
        )
      )
      .get();

    if (!existing) {
      return reply.status(404).send({ message: "Session not found" });
    }

    const { state_json, elapsed_ms, mistakes, completed_at } = parsed.data;

    db.update(gameSessions)
      .set({
        stateJson: state_json,
        elapsedMs: elapsed_ms,
        mistakes,
        completedAt: completed_at
      })
      .where(eq(gameSessions.sessionId, request.params.id))
      .run();

    const updated = db.select().from(gameSessions).where(eq(gameSessions.sessionId, request.params.id)).get();
    return sessionResponseSchema.parse({
      session_id: updated!.sessionId,
      puzzle_id: updated!.puzzleId,
      difficulty: updated!.difficulty,
      state_json: updated!.stateJson,
      started_at: updated!.startedAt,
      completed_at: updated!.completedAt ?? null,
      elapsed_ms: updated!.elapsedMs,
      mistakes: updated!.mistakes
    });
  });
}
