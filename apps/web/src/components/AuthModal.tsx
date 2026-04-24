import { useState } from "react";
import type { UserProfileDto } from "@sudoku/contracts";
import Modal from "./Modal";
import { register, login, requestPasswordReset } from "../api/auth";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfileDto) => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ open, onClose, onAuthSuccess, initialMode = "register" }: Props) {
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function resetForm() {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError(null);
    setResetSent(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await register({
        email,
        password,
        display_name: displayName || undefined
      });
      onAuthSuccess(result.user);
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login({ email, password });
      onAuthSuccess(result.user);
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "register" ? "Create Account" : mode === "login" ? "Sign In" : "Reset Password";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {mode === "register" && (
        <form onSubmit={(e) => void handleRegister(e)}>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-display-name">Display Name (optional)</label>
            <input
              id="auth-display-name"
              className="form-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              autoComplete="nickname"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary form-submit" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create Account"}
          </button>
          <p className="auth-switch">
            Already have an account?{" "}
            <button className="auth-link" type="button" onClick={() => { resetForm(); setMode("login"); }}>
              Sign in
            </button>
          </p>
        </form>
      )}

      {mode === "login" && (
        <form onSubmit={(e) => void handleLogin(e)}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary form-submit" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="auth-switch">
            <button className="auth-link" type="button" onClick={() => { resetForm(); setMode("forgot-password"); }}>
              Forgot password?
            </button>
            {" "}&middot;{" "}
            <button className="auth-link" type="button" onClick={() => { resetForm(); setMode("register"); }}>
              Create account
            </button>
          </p>
        </form>
      )}

      {mode === "forgot-password" && (
        <form onSubmit={(e) => void handleForgotPassword(e)}>
          {resetSent ? (
            <p className="form-success">
              If an account exists with that email, a reset link has been sent.
            </p>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              <button className="btn-primary form-submit" disabled={loading} type="submit">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </>
          )}
          <p className="auth-switch">
            <button className="auth-link" type="button" onClick={() => { resetForm(); setMode("login"); }}>
              Back to sign in
            </button>
          </p>
        </form>
      )}
    </Modal>
  );
}
