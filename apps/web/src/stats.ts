import type { DifficultyDto } from "@sudoku/contracts";
import type { CompletedGameRecord } from "./storage";

export interface DifficultyStats {
  played: number;
  bestTime: number | null;
  avgTime: number | null;
}

export interface DetailedStats {
  totalPlayed: number;
  byDifficulty: Record<DifficultyDto, DifficultyStats>;
  currentStreak: number;
  longestStreak: number;
  recentActivity: { date: string; count: number }[];
}

const DIFFICULTIES: DifficultyDto[] = ["easy", "medium", "hard", "expert"];

export function computeDetailedStats(games: CompletedGameRecord[]): DetailedStats {
  const byDifficulty = Object.fromEntries(
    DIFFICULTIES.map((d) => {
      const matching = games.filter((g) => g.difficulty === d);
      const times = matching.map((g) => g.elapsedMs).sort((a, b) => a - b);
      return [
        d,
        {
          played: matching.length,
          bestTime: times.length > 0 ? times[0] : null,
          avgTime: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null
        }
      ];
    })
  ) as Record<DifficultyDto, DifficultyStats>;

  // Streak calculation
  const dateSet = [...new Set(games.map((g) => g.completedAt.substring(0, 10)))].sort().reverse();
  const today = new Date();

  let currentStreak = 0;
  for (let i = 0; i < dateSet.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (dateSet[i] === expected.toISOString().substring(0, 10)) {
      currentStreak++;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let streak = 0;
  const sortedDates = [...dateSet].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      streak = diffDays === 1 ? streak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  // Recent activity (last 30 days)
  const recentActivity: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const count = games.filter((g) => g.completedAt.substring(0, 10) === dateStr).length;
    recentActivity.push({ date: dateStr, count });
  }

  return {
    totalPlayed: games.length,
    byDifficulty,
    currentStreak,
    longestStreak,
    recentActivity
  };
}
