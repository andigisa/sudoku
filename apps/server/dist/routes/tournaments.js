import { randomUUID } from "node:crypto";
import { eq, and, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { tournaments, tournamentEntries, leaderboardSnapshots, abuseFlags, gameSessions } from "../db/schema.js";
import { env } from "../env.js";
import { tournamentResponseSchema, submitEntryRequestSchema, submitEntryResponseSchema } from "@sudoku/contracts";
import { resolveStatus } from "../services/tournament.js";
import { checkAbuse } from "../services/abuse.js";
import { calculateScore } from "../services/scoring.js";
import { buildLeaderboard } from "../services/leaderboard.js";
import { isSolved, parseGrid } from "@sudoku/domain";
function toResponse(t) {
    return tournamentResponseSchema.parse({
        id: t.id,
        slug: t.slug,
        title: t.title,
        starts_at: t.startsAt,
        ends_at: t.endsAt,
        puzzle_id: t.puzzleId,
        ruleset_version: t.rulesetVersion,
        status: t.status
    });
}
function autoActivate(app, t) {
    const resolved = resolveStatus({ startsAt: t.startsAt, endsAt: t.endsAt });
    if (resolved !== t.status) {
        db.update(tournaments).set({ status: resolved }).where(eq(tournaments.id, t.id)).run();
        app.log.info({ tournamentId: t.id, oldStatus: t.status, newStatus: resolved }, "tournament status updated");
        return { ...t, status: resolved };
    }
    return t;
}
export async function tournamentRoutes(app) {
    // GET /api/v1/tournaments/current
    app.get("/api/v1/tournaments/current", async (_request, reply) => {
        const row = db
            .select()
            .from(tournaments)
            .where(or(eq(tournaments.status, "upcoming"), eq(tournaments.status, "active")))
            .orderBy(sql `${tournaments.startsAt} ASC`)
            .limit(1)
            .get();
        if (!row) {
            return reply.status(404).send({ message: "No active or upcoming tournament" });
        }
        return toResponse(autoActivate(app, row));
    });
    // GET /api/v1/tournaments/:id
    app.get("/api/v1/tournaments/:id", async (request, reply) => {
        const row = db.select().from(tournaments).where(eq(tournaments.id, request.params.id)).get();
        if (!row) {
            return reply.status(404).send({ message: "Tournament not found" });
        }
        return toResponse(autoActivate(app, row));
    });
    // POST /api/v1/tournaments/:id/entries
    app.post("/api/v1/tournaments/:id/entries", async (request, reply) => {
        const parsed = submitEntryRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ message: "Invalid request body" });
        }
        const { session_id, elapsed_ms, mistakes, hints_used, final_board } = parsed.data;
        const tournamentId = request.params.id;
        const guestId = request.guestId;
        // Load and auto-activate tournament
        const tournamentRow = db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).get();
        if (!tournamentRow) {
            return reply.status(404).send({ message: "Tournament not found" });
        }
        const tournament = autoActivate(app, tournamentRow);
        if (tournament.status !== "active") {
            return reply.status(409).send({ message: "Tournament is not active" });
        }
        // Idempotency check
        const duplicate = db
            .select()
            .from(tournamentEntries)
            .where(and(eq(tournamentEntries.tournamentId, tournamentId), eq(tournamentEntries.guestId, guestId), eq(tournamentEntries.sessionId, session_id), eq(tournamentEntries.elapsedMs, elapsed_ms), eq(tournamentEntries.mistakes, mistakes), eq(tournamentEntries.hintsUsed, hints_used)))
            .get();
        if (duplicate && duplicate.status === "valid") {
            const snapshot = db
                .select()
                .from(leaderboardSnapshots)
                .where(and(eq(leaderboardSnapshots.tournamentId, tournamentId), eq(leaderboardSnapshots.guestId, guestId)))
                .get();
            app.log.info({ entryId: duplicate.id }, "tournament entry submitted (idempotent)");
            return submitEntryResponseSchema.parse({
                entry_id: duplicate.id,
                score: duplicate.rawScore,
                rank: snapshot?.rank ?? null,
                is_best: true,
                idempotent: true
            });
        }
        // Verify session ownership
        const session = db
            .select()
            .from(gameSessions)
            .where(and(eq(gameSessions.sessionId, session_id), eq(gameSessions.guestId, guestId)))
            .get();
        if (!session) {
            return reply.status(403).send({ message: "Session not found or does not belong to you" });
        }
        // Abuse detection
        const abuse = checkAbuse(elapsed_ms, env.TOURNAMENT_MIN_SOLVE_MS);
        if (abuse.abusive) {
            const flagId = randomUUID();
            db.insert(abuseFlags)
                .values({ id: flagId, tournamentId, guestId, reason: abuse.reason, createdAt: new Date().toISOString() })
                .run();
            const entryId = randomUUID();
            db.insert(tournamentEntries)
                .values({
                id: entryId, tournamentId, guestId, sessionId: session_id,
                elapsedMs: elapsed_ms, mistakes, hintsUsed: hints_used,
                finalBoard: final_board, rawScore: 0, status: "abuse",
                createdAt: new Date().toISOString()
            })
                .run();
            app.log.warn({ entryId, guestId, reason: abuse.reason }, "abuse flag created");
            return reply.status(422).send({ message: "Submission rejected: impossible solve time" });
        }
        // Validate board
        let boardArray;
        try {
            boardArray = parseGrid(final_board);
        }
        catch {
            return reply.status(422).send({ message: "Invalid final_board format" });
        }
        if (!isSolved(boardArray)) {
            return reply.status(422).send({ message: "Final board is not a valid solution" });
        }
        // Calculate score server-side
        const score = calculateScore(session.difficulty, mistakes, hints_used, env.TOURNAMENT_RULESET_VERSION);
        const entryId = randomUUID();
        const now = new Date().toISOString();
        db.insert(tournamentEntries)
            .values({
            id: entryId, tournamentId, guestId, sessionId: session_id,
            elapsedMs: elapsed_ms, mistakes, hintsUsed: hints_used,
            finalBoard: final_board, rawScore: score, status: "valid",
            createdAt: now
        })
            .run();
        app.log.info({ entryId, tournamentId, guestId, score }, "tournament entry submitted");
        // Determine if this is the guest's new best
        const existingBest = db
            .select()
            .from(leaderboardSnapshots)
            .where(and(eq(leaderboardSnapshots.tournamentId, tournamentId), eq(leaderboardSnapshots.guestId, guestId)))
            .get();
        const isBest = !existingBest || score > existingBest.score;
        if (isBest) {
            // Upsert snapshot for this guest
            db.insert(leaderboardSnapshots)
                .values({ id: existingBest?.id ?? randomUUID(), tournamentId, guestId, entryId, rank: 0, score, updatedAt: now })
                .onConflictDoUpdate({
                target: [leaderboardSnapshots.tournamentId, leaderboardSnapshots.guestId],
                set: { entryId, score, updatedAt: now }
            })
                .run();
            // Recompute all ranks synchronously
            const allSnapshots = db
                .select()
                .from(leaderboardSnapshots)
                .where(eq(leaderboardSnapshots.tournamentId, tournamentId))
                .all();
            const allEntries = allSnapshots.map((s) => {
                const entry = db.select().from(tournamentEntries).where(eq(tournamentEntries.id, s.entryId)).get();
                return {
                    guestId: s.guestId,
                    entryId: s.entryId,
                    score: s.score,
                    elapsedMs: entry.elapsedMs,
                    mistakes: entry.mistakes,
                    hintsUsed: entry.hintsUsed,
                    createdAt: entry.createdAt
                };
            });
            const ranked = buildLeaderboard(allEntries);
            for (const r of ranked) {
                db.update(leaderboardSnapshots)
                    .set({ rank: r.rank })
                    .where(and(eq(leaderboardSnapshots.tournamentId, tournamentId), eq(leaderboardSnapshots.guestId, r.guestId)))
                    .run();
            }
        }
        // Get caller's rank
        const mySnapshot = db
            .select()
            .from(leaderboardSnapshots)
            .where(and(eq(leaderboardSnapshots.tournamentId, tournamentId), eq(leaderboardSnapshots.guestId, guestId)))
            .get();
        return submitEntryResponseSchema.parse({
            entry_id: entryId,
            score,
            rank: mySnapshot?.rank ?? null,
            is_best: isBest,
            idempotent: false
        });
    });
}
//# sourceMappingURL=tournaments.js.map