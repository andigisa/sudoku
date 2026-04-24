import { useState } from "react";
import type { UserProfileDto } from "@sudoku/contracts";
import Modal from "./Modal";
import { updateProfile, logout as apiLogout } from "../api/auth";

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserProfileDto;
  onProfileUpdate: (user: UserProfileDto) => void;
  onLogout: () => void;
}

export default function AccountSettings({ open, onClose, user, onProfileUpdate, onLogout }: Props) {
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateProfile({ display_name: displayName || null });
      onProfileUpdate(updated);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await apiLogout();
    onLogout();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Account">
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" value={user.email} disabled />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="settings-display-name">Display Name</label>
        <input
          id="settings-display-name"
          className="form-input"
          type="text"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
          maxLength={30}
        />
      </div>
      {error && <div className="form-error">{error}</div>}
      {saved && <div className="form-success">Saved</div>}
      <button
        className="btn-primary form-submit"
        disabled={saving}
        onClick={() => void handleSave()}
        type="button"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <div style={{ marginTop: 16, borderTop: "1px solid var(--outline-variant)", paddingTop: 16 }}>
        <button className="btn-ghost" onClick={() => void handleLogout()} type="button" style={{ color: "var(--error)" }}>
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>
      </div>
    </Modal>
  );
}
