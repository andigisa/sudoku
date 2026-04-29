export interface AdminStats {
  guests: { total: number; today: number; returning: number };
  users: { total: number; today: number };
  sessions: {
    total: number;
    completed: number;
    today: number;
    avgCompletionMs: number | null;
    byDifficulty: { difficulty: string; count: number }[];
  };
  activeSessions: number;
  tournaments: { total: number; entriesTotal: number; abuseFlagsTotal: number };
  trends: {
    guestsPerDay: { date: string; count: number }[];
    gamesPerDay: { date: string; count: number }[];
    registrationsPerDay: { date: string; count: number }[];
  };
}

export interface Tournament {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string;
  puzzle_id: string;
  ruleset_version: string;
  status: string;
}

export interface PuzzleOption {
  puzzle_id: string;
  difficulty: string;
}

export async function adminLogin(password: string): Promise<boolean> {
  const res = await fetch("/api/v1/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  return res.ok;
}

export async function adminLogout(): Promise<void> {
  await fetch("/api/v1/admin/logout", { method: "POST" });
}

export async function adminCheckAuth(): Promise<boolean> {
  const res = await fetch("/api/v1/admin/me");
  return res.ok;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch("/api/v1/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchAdminTournaments(): Promise<Tournament[]> {
  const res = await fetch("/api/v1/admin/tournaments");
  if (!res.ok) throw new Error("Failed to fetch tournaments");
  return res.json();
}

export async function fetchAdminPuzzles(): Promise<PuzzleOption[]> {
  const res = await fetch("/api/v1/admin/puzzles");
  if (!res.ok) throw new Error("Failed to fetch puzzles");
  return res.json();
}

export async function createTournament(body: {
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string;
  puzzle_id: string;
}): Promise<Tournament> {
  const res = await fetch("/api/v1/admin/tournaments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Failed to create tournament");
  }
  return res.json();
}
