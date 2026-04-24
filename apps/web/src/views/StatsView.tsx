import { useEffect, useState } from "react";
import type { DifficultyDto } from "@sudoku/contracts";
import { listAllCompletedGames, type CompletedGameRecord } from "../storage";
import { computeDetailedStats, type DetailedStats } from "../stats";

interface Props {
  onBack: () => void;
}

const difficultyLabels: Record<DifficultyDto, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert"
};

function formatTime(ms: number | null): string {
  if (ms === null) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function StatsView({ onBack }: Props) {
  const [stats, setStats] = useState<DetailedStats | null>(null);

  useEffect(() => {
    void listAllCompletedGames().then((games: CompletedGameRecord[]) => {
      setStats(computeDetailedStats(games));
    });
  }, []);

  if (!stats) return null;

  const maxActivity = Math.max(...stats.recentActivity.map((a) => a.count), 1);

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <button className="btn-ghost" onClick={onBack} type="button">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="app-title">Statistics</span>
          <div style={{ width: 40 }} />
        </div>
      </header>
      <main className="stats-shell">
        {/* Overview */}
        <div className="stats-overview">
          <div className="stats-overview-card">
            <div className="stat-value">{stats.totalPlayed}</div>
            <div className="stat-label">Games Played</div>
          </div>
          <div className="stats-overview-card">
            <div className="stat-value">{stats.currentStreak}</div>
            <div className="stat-label">Current Streak</div>
          </div>
          <div className="stats-overview-card">
            <div className="stat-value">{stats.longestStreak}</div>
            <div className="stat-label">Longest Streak</div>
          </div>
          <div className="stats-overview-card">
            <div className="stat-value">
              {formatTime(
                Math.min(
                  ...Object.values(stats.byDifficulty)
                    .map((d) => d.bestTime)
                    .filter((t): t is number => t !== null)
                ) || null
              )}
            </div>
            <div className="stat-label">Best Time</div>
          </div>
        </div>

        {/* By Difficulty */}
        <h2 className="section-heading">By Difficulty</h2>
        <div className="stats-difficulty-list">
          {(Object.keys(difficultyLabels) as DifficultyDto[]).map((d) => {
            const ds = stats.byDifficulty[d];
            return (
              <div key={d} className="stats-difficulty-row">
                <span className="stats-difficulty-label">{difficultyLabels[d]}</span>
                <span className="stats-difficulty-stat">
                  <span className="stat-label">Played</span>
                  <span className="stat-value-sm">{ds.played}</span>
                </span>
                <span className="stats-difficulty-stat">
                  <span className="stat-label">Best</span>
                  <span className="stat-value-sm">{formatTime(ds.bestTime)}</span>
                </span>
                <span className="stats-difficulty-stat">
                  <span className="stat-label">Avg</span>
                  <span className="stat-value-sm">{formatTime(ds.avgTime)}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Activity Chart */}
        <h2 className="section-heading">Last 30 Days</h2>
        <div className="stats-chart">
          {stats.recentActivity.map((a) => (
            <div key={a.date} className="stats-chart-col">
              <div
                className="stats-chart-bar"
                style={{ height: `${(a.count / maxActivity) * 100}%` }}
                title={`${a.date}: ${a.count} game${a.count !== 1 ? "s" : ""}`}
              />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
