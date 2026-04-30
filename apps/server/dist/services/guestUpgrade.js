import { db } from "../db/index.js";
import { gameSessions, tournamentEntries, leaderboardSnapshots, abuseFlags } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
/**
 * Migrate all guest-owned data to a user account.
 * The `AND user_id IS NULL` guard makes this idempotent — running it twice
 * for the same guestId/userId pair is a no-op the second time.
 */
export function upgradeGuestToUser(guestId, userId) {
    const tables = [gameSessions, tournamentEntries, leaderboardSnapshots, abuseFlags];
    // Run all updates in a single transaction for atomicity
    db.transaction((tx) => {
        for (const table of tables) {
            tx.update(table)
                .set({ userId })
                .where(and(eq(table.guestId, guestId), isNull(table.userId)))
                .run();
        }
    });
}
//# sourceMappingURL=guestUpgrade.js.map