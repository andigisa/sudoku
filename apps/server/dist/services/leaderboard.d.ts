export interface LeaderboardInputEntry {
    guestId: string;
    entryId: string;
    score: number;
    elapsedMs: number;
    mistakes: number;
    hintsUsed: number;
    createdAt: string;
}
export interface RankedEntry extends LeaderboardInputEntry {
    rank: number;
    displayName: string;
}
/**
 * Sort entries by the spec tie-break rules and assign 1-based ranks.
 * Caller is responsible for passing only the best valid entry per guest —
 * passing all entries will produce incorrect rankings.
 */
export declare function buildLeaderboard(entries: LeaderboardInputEntry[], displayNameOverrides?: Map<string, string>): RankedEntry[];
/**
 * Deterministic, PII-free display name derived from the guest ID.
 */
export declare function deriveDisplayName(guestId: string): string;
