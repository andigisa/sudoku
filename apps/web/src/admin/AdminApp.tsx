import { useEffect, useState } from "react";
import { adminCheckAuth, adminLogout } from "./api";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import TournamentManager from "./TournamentManager";

type Tab = "dashboard" | "tournaments";

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    adminCheckAuth().then(setAuthenticated);
  }, []);

  if (authenticated === null) {
    return <div className="admin-loading">Checking authentication...</div>;
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <h1 className="admin-logo">Sudoku Admin</h1>
        <nav className="admin-nav">
          <button
            className={`admin-tab ${tab === "dashboard" ? "active" : ""}`}
            onClick={() => setTab("dashboard")}
            type="button"
          >
            <span className="material-symbols-outlined">analytics</span>
            Dashboard
          </button>
          <button
            className={`admin-tab ${tab === "tournaments" ? "active" : ""}`}
            onClick={() => setTab("tournaments")}
            type="button"
          >
            <span className="material-symbols-outlined">trophy</span>
            Tournaments
          </button>
        </nav>
        <button
          className="admin-logout"
          onClick={() => { void adminLogout().then(() => setAuthenticated(false)); }}
          type="button"
        >
          Logout
        </button>
      </header>
      <main className="admin-main">
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "tournaments" && <TournamentManager />}
      </main>
    </div>
  );
}
