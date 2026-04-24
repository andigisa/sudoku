import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { tournaments, tournamentEntries, leaderboardSnapshots, users } from "../db/schema.js";
import { leaderboardResponseSchema } from "@sudoku/contracts";
import { buildLeaderboard } from "../services/leaderboard.js";

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/api/v1/leaderboards/tournament/:id", async (request, reply) => {
    const tournament = db.select().from(tournaments).where(eq(tournaments.id, request.params.id)).get();
    if (!tournament) {
      return reply.status(404).send({ message: "Tournament not found" });
    }

    // Fetch all leaderboard snapshots (one per guest, pre-computed best score)
    const snapshots = db
      .select()
      .from(leaderboardSnapshots)
      .where(eq(leaderboardSnapshots.tournamentId, request.params.id))
      .all();

    const entries = snapshots
      .map((s) => {
        const entry = db
          .select()
          .from(tournamentEntries)
          .where(and(eq(tournamentEntries.id, s.entryId), eq(tournamentEntries.status, "valid")))
          .get();

        if (!entry) return null;

        return {
          guestId: s.guestId,
          entryId: s.entryId,
          score: s.score,
          elapsedMs: entry.elapsedMs,
          mistakes: entry.mistakes,
          hintsUsed: entry.hintsUsed,
          createdAt: entry.createdAt
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    // Look up display names for users who set one
    const guestIds = [...new Set(entries.map((e) => e.guestId))];
    const displayNameOverrides = new Map<string, string>();
    if (guestIds.length > 0) {
      const userRows = db
        .select({ guestId: users.guestId, displayName: users.displayName })
        .from(users)
        .where(inArray(users.guestId, guestIds))
        .all();
      for (const row of userRows) {
        if (row.guestId && row.displayName) {
          displayNameOverrides.set(row.guestId, row.displayName);
        }
      }
    }

    const ranked = buildLeaderboard(entries, displayNameOverrides);

    app.log.info({ tournamentId: request.params.id, total: ranked.length }, "leaderboard requested");

    return leaderboardResponseSchema.parse({
      tournament_id: request.params.id,
      total: ranked.length,
      entries: ranked.map((r) => ({
        rank: r.rank,
        display_name: r.displayName,
        score: r.score,
        elapsed_ms: r.elapsedMs,
        mistakes: r.mistakes,
        hints_used: r.hintsUsed,
        submitted_at: r.createdAt
      }))
    });
  });
}
