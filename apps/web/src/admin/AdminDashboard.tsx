import { useEffect, useState } from "react";
import { fetchAdminStats, type AdminStats } from "./api";

function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function TrendChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  if (data.length === 0) return <div className="trend-empty">No data</div>;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="trend-card">
      <h3 className="trend-title">{label}</h3>
      <div className="trend-bars">
        {data.map((d) => (
          <div key={d.date} className="trend-bar-col" title={`${d.date}: ${d.count}`}>
            <div className="trend-bar" style={{ height: `${(d.count / max) * 100}%` }} />
            <span className="trend-bar-label">{d.count}</span>
          </div>
        ))}
      </div>
      <div className="trend-dates">
        {data.length > 0 && <span>{data[0].date.slice(5)}</span>}
        {data.length > 1 && <span>{data[data.length - 1].date.slice(5)}</span>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminStats().then(setStats).catch(() => setError("Failed to load stats"));
  }, []);

  if (error) return <div className="admin-error">{error}</div>;
  if (!stats) return <div className="admin-loading">Loading stats...</div>;

  return (
    <div>
      <h2 className="admin-section-title">Overview</h2>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-value">{stats.guests.total}</div>
          <div className="stat-card-label">Total Guests</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.users.total}</div>
          <div className="stat-card-label">Registered Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.guests.returning}</div>
          <div className="stat-card-label">Returning Players</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.activeSessions}</div>
          <div className="stat-card-label">Active Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.sessions.total}</div>
          <div className="stat-card-label">Games Played</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.sessions.completed}</div>
          <div className="stat-card-label">Games Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">
            {stats.sessions.avgCompletionMs ? formatMs(stats.sessions.avgCompletionMs) : "—"}
          </div>
          <div className="stat-card-label">Avg. Completion</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.tournaments.abuseFlagsTotal}</div>
          <div className="stat-card-label">Abuse Flags</div>
        </div>
      </div>

      <h2 className="admin-section-title">Today</h2>
      <div className="stat-cards">
        <div className="stat-card accent">
          <div className="stat-card-value">{stats.guests.today}</div>
          <div className="stat-card-label">New Guests</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-card-value">{stats.users.today}</div>
          <div className="stat-card-label">New Registrations</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-card-value">{stats.sessions.today}</div>
          <div className="stat-card-label">Games Started</div>
        </div>
      </div>

      <h2 className="admin-section-title">By Difficulty</h2>
      <div className="difficulty-table">
        {stats.sessions.byDifficulty.map((d) => (
          <div key={d.difficulty} className="difficulty-row">
            <span className="difficulty-name">{d.difficulty}</span>
            <span className="difficulty-count">{d.count}</span>
          </div>
        ))}
        {stats.sessions.byDifficulty.length === 0 && (
          <div className="difficulty-row">No games yet</div>
        )}
      </div>

      <h2 className="admin-section-title">Tournaments</h2>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-value">{stats.tournaments.total}</div>
          <div className="stat-card-label">Tournaments</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.tournaments.entriesTotal}</div>
          <div className="stat-card-label">Total Entries</div>
        </div>
      </div>

      <h2 className="admin-section-title">30-Day Trends</h2>
      <div className="trends-grid">
        <TrendChart data={stats.trends.guestsPerDay} label="New Guests / Day" />
        <TrendChart data={stats.trends.gamesPerDay} label="Games / Day" />
        <TrendChart data={stats.trends.registrationsPerDay} label="Registrations / Day" />
      </div>
    </div>
  );
}
