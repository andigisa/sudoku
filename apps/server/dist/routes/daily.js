import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { dailyChallenges, gameSessions } from "../db/schema.js";
import { getRandomPuzzle, getPuzzleById } from "../puzzles.js";
import { dailyChallengeResponseSchema } from "@sudoku/contracts";
const DAILY_DIFFICULTY = "medium";
function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}
function getOrCreateDailyChallenge(date) {
    const existing = db.select().from(dailyChallenges).where(eq(dailyChallenges.challengeDate, date)).get();
    if (existing)
        return existing;
    const puzzle = getRandomPuzzle(DAILY_DIFFICULTY);
    db.insert(dailyChallenges)
        .values({ challengeDate: date, puzzleId: puzzle.puzzle_id, difficulty: DAILY_DIFFICULTY })
        .run();
    return db.select().from(dailyChallenges).where(eq(dailyChallenges.challengeDate, date)).get();
}
export async function dailyRoutes(app) {
    app.get("/api/v1/daily", async (request) => {
        const today = getTodayDate();
        const challenge = getOrCreateDailyChallenge(today);
        const puzzle = getPuzzleById(challenge.puzzleId);
        if (!puzzle) {
            throw new Error(`Daily challenge puzzle not found: ${challenge.puzzleId}`);
        }
        const existingSession = db
            .select()
            .from(gameSessions)
            .where(and(eq(gameSessions.guestId, request.guestId), eq(gameSessions.puzzleId, challenge.puzzleId)))
            .get();
        return dailyChallengeResponseSchema.parse({
            date: today,
            puzzle,
            session: existingSession
                ? {
                    session_id: existingSession.sessionId,
                    puzzle_id: existingSession.puzzleId,
                    difficulty: existingSession.difficulty,
                    state_json: existingSession.stateJson,
                    started_at: existingSession.startedAt,
                    completed_at: existingSession.completedAt ?? null,
                    elapsed_ms: existingSession.elapsedMs,
                    mistakes: existingSession.mistakes
                }
                : null
        });
    });
}
//# sourceMappingURL=daily.js.map