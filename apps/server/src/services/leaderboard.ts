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
export function buildLeaderboard(
  entries: LeaderboardInputEntry[],
  displayNameOverrides?: Map<string, string>
): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => {
    // 1. Higher score wins
    if (b.score !== a.score) return b.score - a.score;
    // 2. Lower elapsed time wins
    if (a.elapsedMs !== b.elapsedMs) return a.elapsedMs - b.elapsedMs;
    // 3. Earlier submission wins
    return a.createdAt.localeCompare(b.createdAt);
  });

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    displayName: displayNameOverrides?.get(entry.guestId) ?? deriveDisplayName(entry.guestId)
  }));
}

/**
 * Deterministic, PII-free display name derived from the guest ID.
 */
export function deriveDisplayName(guestId: string): string {
  return `Guest #${guestId.slice(0, 5)}`;
}
