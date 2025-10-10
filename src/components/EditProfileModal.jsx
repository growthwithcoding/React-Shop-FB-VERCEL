// src/components/EditProfileModal.jsx
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { updateUser } from "../services/userService";

export default function EditProfileModal({ isOpen, onClose, initialData, onSuccess }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
  });

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  async function handleSave(e) {
    e.preventDefault();
    if (!user?.uid) return;
    
    setSaving(true);
    setError("");
    
    try {
      await updateUser({
        id: user.uid,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Edit Profile</h3>
          <button className="btn btn-secondary btn-slim" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid" style={{ gap: 12 }}>
            <label className="field">
              <div className="meta">First Name</div>
              <input
                className="input"
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                placeholder="Jane"
                autoFocus
              />
            </label>

            <label className="field">
              <div className="meta">Last Name</div>
              <input
                className="input"
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                placeholder="Doe"
              />
            </label>

            <label className="field">
              <div className="meta">Email (Read-only)</div>
              <input
                className="input"
                type="email"
                value={user?.email || ""}
                disabled
                style={{ background: "#f3f4f6", cursor: "not-allowed" }}
              />
            </label>

            {error && (
              <div className="card" style={{ padding: 12, background: "#fee", border: "1px solid #fcc", color: "#c00" }}>
                {error}
              </div>
            )}

            <div className="actions" style={{ marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={onClose} type="button" disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
