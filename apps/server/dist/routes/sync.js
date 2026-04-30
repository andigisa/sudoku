import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, gameSessions, syncStates } from "../db/schema.js";
import { syncBootstrapResponseSchema, syncPushRequestSchema, syncPushResultSchema } from "@sudoku/contracts";
function mapSession(s) {
    return {
        session_id: s.sessionId,
        puzzle_id: s.puzzleId,
        difficulty: s.difficulty,
        state_json: s.stateJson,
        started_at: s.startedAt,
        completed_at: s.completedAt ?? null,
        elapsed_ms: s.elapsedMs,
        mistakes: s.mistakes
    };
}
export async function syncRoutes(app) {
    // ── Bootstrap ─────────────────────────────────────────────────────────────
    app.get("/api/v1/sync/bootstrap", async (request, reply) => {
        if (!request.isAuthenticated || !request.userId) {
            return reply.status(401).send({ message: "Not authenticated" });
        }
        const user = db.select().from(users).where(eq(users.id, request.userId)).get();
        if (!user) {
            return reply.status(401).send({ message: "Not authenticated" });
        }
        const sync = db.select().from(syncStates).where(eq(syncStates.userId, request.userId)).get();
        const settings = sync?.settingsJson ? JSON.parse(sync.settingsJson) : {};
        const inProgress = db
            .select()
            .from(gameSessions)
            .where(and(eq(gameSessions.guestId, request.guestId), isNull(gameSessions.completedAt)))
            .orderBy(desc(gameSessions.startedAt))
            .limit(5)
            .all();
        const recent = db
            .select()
            .from(gameSessions)
            .where(and(eq(gameSessions.guestId, request.guestId), isNotNull(gameSessions.completedAt)))
            .orderBy(desc(gameSessions.completedAt))
            .limit(20)
            .all();
        return syncBootstrapResponseSchema.parse({
            user: {
                id: user.id,
                email: user.email,
                display_name: user.displayName,
                created_at: user.createdAt
            },
            settings,
            recent_sessions: recent.map(mapSession),
            in_progress_games: inProgress.map(mapSession),
            sync_version: sync?.version ?? 0
        });
    });
    // ── Push ──────────────────────────────────────────────────────────────────
    app.post("/api/v1/sync/push", async (request, reply) => {
        if (!request.isAuthenticated || !request.userId) {
            return reply.status(401).send({ message: "Not authenticated" });
        }
        const parsed = syncPushRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ message: "Invalid request body" });
        }
        const { last_known_version, changes } = parsed.data;
        const sync = db.select().from(syncStates).where(eq(syncStates.userId, request.userId)).get();
        const currentVersion = sync?.version ?? 0;
        // Stale client — reject all, tell them to re-bootstrap
        if (last_known_version !== currentVersion) {
            return syncPushResultSchema.parse({
                accepted: [],
                rejected: changes.map((_, i) => ({
                    index: i,
                    status: "rejected",
                    reason: "version_conflict"
                })),
                new_version: currentVersion
            });
        }
        const accepted = [];
        const rejected = [];
        for (let i = 0; i < changes.length; i++) {
            const change = changes[i];
            if (change.type === "setting_change") {
                // Merge into settings_json
                const currentSettings = sync?.settingsJson
                    ? JSON.parse(sync.settingsJson)
                    : {};
                const payload = change.payload;
                Object.assign(currentSettings, payload);
                db.update(syncStates)
                    .set({ settingsJson: JSON.stringify(currentSettings), updatedAt: new Date().toISOString() })
                    .where(eq(syncStates.userId, request.userId))
                    .run();
                accepted.push({ index: i, status: "accepted" });
            }
            else if (change.type === "session_update") {
                const payload = change.payload;
                if (!payload.session_id) {
                    rejected.push({ index: i, status: "rejected", reason: "missing_session_id" });
                    continue;
                }
                const session = db
                    .select()
                    .from(gameSessions)
                    .where(and(eq(gameSessions.sessionId, payload.session_id), eq(gameSessions.guestId, request.guestId)))
                    .get();
                if (!session) {
                    rejected.push({ index: i, status: "rejected", reason: "session_not_found" });
                    continue;
                }
                // Last-write-wins by timestamp
                db.update(gameSessions)
                    .set({
                    stateJson: payload.state_json ?? session.stateJson,
                    elapsedMs: payload.elapsed_ms ?? session.elapsedMs,
                    mistakes: payload.mistakes ?? session.mistakes,
                    completedAt: payload.completed_at !== undefined ? payload.completed_at : session.completedAt
                })
                    .where(eq(gameSessions.sessionId, payload.session_id))
                    .run();
                accepted.push({ index: i, status: "accepted" });
            }
            else {
                rejected.push({ index: i, status: "rejected", reason: "unknown_type" });
            }
        }
        // Atomically increment version
        if (accepted.length > 0) {
            db.update(syncStates)
                .set({ version: currentVersion + 1, updatedAt: new Date().toISOString() })
                .where(eq(syncStates.userId, request.userId))
                .run();
        }
        return syncPushResultSchema.parse({
            accepted,
            rejected,
            new_version: accepted.length > 0 ? currentVersion + 1 : currentVersion
        });
    });
}
//# sourceMappingURL=sync.js.map