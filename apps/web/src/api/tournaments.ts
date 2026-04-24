import type {
  TournamentResponseDto,
  SubmitEntryRequestDto,
  SubmitEntryResponseDto,
  LeaderboardResponseDto
} from "@sudoku/contracts";

export async function fetchCurrentTournament(): Promise<TournamentResponseDto | null> {
  const res = await fetch("/api/v1/tournaments/current");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch tournament: ${res.status}`);
  return res.json() as Promise<TournamentResponseDto>;
}

export async function fetchTournament(id: string): Promise<TournamentResponseDto | null> {
  const res = await fetch(`/api/v1/tournaments/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch tournament: ${res.status}`);
  return res.json() as Promise<TournamentResponseDto>;
}

export async function submitTournamentEntry(
  tournamentId: string,
  body: SubmitEntryRequestDto
): Promise<SubmitEntryResponseDto> {
  const res = await fetch(`/api/v1/tournaments/${tournamentId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? `Entry submission failed: ${res.status}`);
  }
  return res.json() as Promise<SubmitEntryResponseDto>;
}

export async function fetchLeaderboard(tournamentId: string): Promise<LeaderboardResponseDto> {
  const res = await fetch(`/api/v1/leaderboards/tournament/${tournamentId}`);
  if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.status}`);
  return res.json() as Promise<LeaderboardResponseDto>;
}
