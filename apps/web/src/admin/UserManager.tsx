import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminUsers,
  fetchAdminGuests,
  type AdminUser,
  type AdminGuest
} from "./api";

type UserTab = "accounts" | "guests";
type SortKey = "createdAt" | "lastActive" | "totalGames" | "completedGames";
type SortDir = "asc" | "desc";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export default function UserManager() {
  const [tab, setTab] = useState<UserTab>("accounts");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    setLoading(true);
    setError("");
    if (tab === "accounts") {
      fetchAdminUsers()
        .then(setUsers)
        .catch(() => setError("Failed to load users"))
        .finally(() => setLoading(false));
    } else {
      fetchAdminGuests()
        .then(setGuests)
        .catch(() => setError("Failed to load guests"))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIcon(key: SortKey): string {
    if (sortKey !== key) return "unfold_more";
    return sortDir === "asc" ? "expand_less" : "expand_more";
  }

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    let list = q
      ? users.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            (u.displayName ?? "").toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q)
        )
      : [...users];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt" || sortKey === "lastActive") {
        cmp = a[sortKey].localeCompare(b[sortKey]);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, search, sortKey, sortDir]);

  const filteredGuests = useMemo(() => {
    const q = search.toLowerCase();
    let list = q
      ? guests.filter((g) => g.guestId.toLowerCase().includes(q))
      : [...guests];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt" || sortKey === "lastActive") {
        cmp = a[sortKey].localeCompare(b[sortKey]);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [guests, search, sortKey, sortDir]);

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Users</h2>
        <div className="user-tab-bar">
          <button
            className={`user-tab ${tab === "accounts" ? "active" : ""}`}
            onClick={() => setTab("accounts")}
            type="button"
          >
            Accounts ({users.length})
          </button>
          <button
            className={`user-tab ${tab === "guests" ? "active" : ""}`}
            onClick={() => setTab("guests")}
            type="button"
          >
            Guests ({guests.length})
          </button>
        </div>
      </div>

      <div className="user-toolbar">
        <div className="user-search-wrapper">
          <span className="material-symbols-outlined user-search-icon">search</span>
          <input
            className="admin-input user-search"
            type="text"
            placeholder={tab === "accounts" ? "Search by email, name, or ID..." : "Search by guest ID..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading && <div className="admin-loading">Loading...</div>}

      {!loading && !error && tab === "accounts" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th className="sortable-th" onClick={() => toggleSort("totalGames")}>
                  Games <span className="material-symbols-outlined sort-icon">{sortIcon("totalGames")}</span>
                </th>
                <th className="sortable-th" onClick={() => toggleSort("completedGames")}>
                  Completed <span className="material-symbols-outlined sort-icon">{sortIcon("completedGames")}</span>
                </th>
                <th>Play Time</th>
                <th className="sortable-th" onClick={() => toggleSort("createdAt")}>
                  Registered <span className="material-symbols-outlined sort-icon">{sortIcon("createdAt")}</span>
                </th>
                <th className="sortable-th" onClick={() => toggleSort("lastActive")}>
                  Last Active <span className="material-symbols-outlined sort-icon">{sortIcon("lastActive")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.displayName ?? <span className="dim">—</span>}</td>
                  <td>{u.totalGames}</td>
                  <td>{u.completedGames}</td>
                  <td>{u.totalElapsedMs > 0 ? formatMs(u.totalElapsedMs) : "—"}</td>
                  <td title={formatDateTime(u.createdAt)}>{formatDate(u.createdAt)}</td>
                  <td title={formatDateTime(u.lastActive)}>{timeAgo(u.lastActive)}</td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    {search ? "No matching users" : "No registered users yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && tab === "guests" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Guest ID</th>
                <th>Account</th>
                <th className="sortable-th" onClick={() => toggleSort("totalGames")}>
                  Games <span className="material-symbols-outlined sort-icon">{sortIcon("totalGames")}</span>
                </th>
                <th className="sortable-th" onClick={() => toggleSort("completedGames")}>
                  Completed <span className="material-symbols-outlined sort-icon">{sortIcon("completedGames")}</span>
                </th>
                <th className="sortable-th" onClick={() => toggleSort("createdAt")}>
                  First Seen <span className="material-symbols-outlined sort-icon">{sortIcon("createdAt")}</span>
                </th>
                <th className="sortable-th" onClick={() => toggleSort("lastActive")}>
                  Last Active <span className="material-symbols-outlined sort-icon">{sortIcon("lastActive")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((g) => (
                <tr key={g.guestId}>
                  <td><code>{g.guestId.slice(0, 12)}...</code></td>
                  <td>
                    {g.hasAccount
                      ? <span className="badge badge-active">Yes</span>
                      : <span className="badge badge-ended">No</span>}
                  </td>
                  <td>{g.totalGames}</td>
                  <td>{g.completedGames}</td>
                  <td title={formatDateTime(g.createdAt)}>{formatDate(g.createdAt)}</td>
                  <td title={formatDateTime(g.lastActive)}>{timeAgo(g.lastActive)}</td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    {search ? "No matching guests" : "No guests yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
