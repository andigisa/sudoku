export type TournamentStatus = "upcoming" | "active" | "ended";

/**
 * Derive the current tournament status purely from timestamps.
 * Kept free of DB access so it is testable and so the route handler
 * can decide when (and whether) to persist a status transition.
 */
export function resolveStatus(tournament: {
  startsAt: string;
  endsAt: string;
}): TournamentStatus {
  const now = Date.now();
  const start = new Date(tournament.startsAt).getTime();
  const end = new Date(tournament.endsAt).getTime();

  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}
