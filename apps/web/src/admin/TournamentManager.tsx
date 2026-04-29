import { useEffect, useState } from "react";
import {
  fetchAdminTournaments,
  fetchAdminPuzzles,
  createTournament,
  type Tournament,
  type PuzzleOption
} from "./api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "active" ? "badge-active" : status === "upcoming" ? "badge-upcoming" : "badge-ended";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [puzzles, setPuzzles] = useState<PuzzleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [puzzleId, setPuzzleId] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([fetchAdminTournaments(), fetchAdminPuzzles()]);
      setTournaments(t);
      setPuzzles(p);
      if (p.length > 0 && !puzzleId) setPuzzleId(p[0].puzzle_id);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await createTournament({
        slug,
        title,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        puzzle_id: puzzleId
      });

      setSlug("");
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setShowForm(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="admin-error">{error}</div>;
  if (loading) return <div className="admin-loading">Loading tournaments...</div>;

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Tournaments</h2>
        <button
          className="admin-btn-primary"
          onClick={() => setShowForm(!showForm)}
          type="button"
        >
          {showForm ? "Cancel" : "+ New Tournament"}
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={(e) => void handleCreate(e)}>
          <div className="admin-form-row">
            <label className="admin-field-label" htmlFor="t-slug">Slug</label>
            <input
              id="t-slug"
              className="admin-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. spring-2026"
              required
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-field-label" htmlFor="t-title">Title</label>
            <input
              id="t-title"
              className="admin-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spring Championship"
              required
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-field-label" htmlFor="t-start">Starts At</label>
            <input
              id="t-start"
              className="admin-input"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-field-label" htmlFor="t-end">Ends At</label>
            <input
              id="t-end"
              className="admin-input"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-field-label" htmlFor="t-puzzle">Puzzle</label>
            <select
              id="t-puzzle"
              className="admin-input"
              value={puzzleId}
              onChange={(e) => setPuzzleId(e.target.value)}
              required
            >
              {puzzles.map((p) => (
                <option key={p.puzzle_id} value={p.puzzle_id}>
                  {p.puzzle_id} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>
          {formError && <div className="admin-error">{formError}</div>}
          <button className="admin-btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Tournament"}
          </button>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Puzzle</th>
            <th>Starts</th>
            <th>Ends</th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td><code>{t.slug}</code></td>
              <td><StatusBadge status={t.status} /></td>
              <td><code>{t.puzzle_id}</code></td>
              <td>{formatDate(t.starts_at)}</td>
              <td>{formatDate(t.ends_at)}</td>
            </tr>
          ))}
          {tournaments.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", opacity: 0.6 }}>No tournaments yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
