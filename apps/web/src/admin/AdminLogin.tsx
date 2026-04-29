import { useState } from "react";
import { adminLogin } from "./api";

interface Props {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await adminLogin(password);
      if (ok) {
        onSuccess();
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrapper">
      <form className="admin-login-form" onSubmit={(e) => void handleSubmit(e)}>
        <h1>Sudoku Admin</h1>
        <label className="admin-field-label" htmlFor="admin-pw">Admin Password</label>
        <input
          id="admin-pw"
          className="admin-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        {error && <div className="admin-error">{error}</div>}
        <button className="admin-btn-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
