export type TournamentStatus = "upcoming" | "active" | "ended";
/**
 * Derive the current tournament status purely from timestamps.
 * Kept free of DB access so it is testable and so the route handler
 * can decide when (and whether) to persist a status transition.
 */
export declare function resolveStatus(tournament: {
    startsAt: string;
    endsAt: string;
}): TournamentStatus;
