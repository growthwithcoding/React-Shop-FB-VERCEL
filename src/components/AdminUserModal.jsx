// src/components/AdminUserModal.jsx
import { useEffect, useState } from "react";

/**
 * Props:
 * - open: boolean
 * - mode: "create" | "edit" | "delete"
 * - initialUser?: { id?, firstName, lastName, email, role, orders? }
 * - onClose(): void
 * - onSave(userDraft): Promise<void> | void   // for create/edit
 * - onDelete(user): Promise<void> | void      // for delete
 */
export default function AdminUserModal({
  open,
  mode,
  initialUser,
  onClose,
  onSave,
  onDelete,
}) {
  const isDelete = mode === "delete";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "customer",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    setBusy(false);
    if (isEdit && initialUser) {
      setDraft({
        firstName: initialUser.firstName || "",
        lastName: initialUser.lastName || "",
        email: initialUser.email || "",
        role: initialUser.role || "customer",
      });
    } else if (isCreate) {
      setDraft({ firstName: "", lastName: "", email: "", role: "customer" });
    }
  }, [open, isEdit, isCreate, initialUser]);

  if (!open) return null;

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (isDelete) return;
    if (!draft.firstName.trim() || !draft.email.trim()) {
      setErr("First name and email are required.");
      return;
    }
    try {
      setBusy(true);
      await onSave?.(draft);
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    try {
      setBusy(true);
      await onDelete?.(initialUser);
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Failed to delete user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>
            {isCreate && "Add User"}
            {isEdit && "Edit User"}
            {isDelete && "Delete User"}
          </h3>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {isDelete ? (
          <>
            <p style={{ marginTop: 0 }}>
              Are you sure you want to delete{" "}
              <strong>
                {[initialUser?.firstName, initialUser?.lastName].filter(Boolean).join(" ") || "this user"}
              </strong>?
            </p>
            {err && <div className="card" style={{ padding: 8, marginBottom: 10, color: "var(--danger, #991b1b)" }}>{err}</div>}
            <div className="actions">
              <button
                onClick={onClose}
                disabled={busy}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: busy ? "#9ca3af" : "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!busy) {
                    e.currentTarget.style.background = "#b91c1c";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!busy) {
                    e.currentTarget.style.background = "#dc2626";
                  }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                {busy ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label className="field">
                <div className="meta">First name</div>
                <input
                  className="input"
                  placeholder="Jane"
                  value={draft.firstName}
                  onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                />
              </label>

              <label className="field">
                <div className="meta">Last name</div>
                <input
                  className="input"
                  placeholder="Doe"
                  value={draft.lastName}
                  onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                />
              </label>

              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Email</div>
                <input
                  className="input"
                  placeholder="jane@example.com"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                />
              </label>

              <label className="field">
                <div className="meta">Role</div>
                <select
                  className="select"
                  value={draft.role}
                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                >
                  <option value="customer">Customer</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>

            {err && <div className="card" style={{ padding: 8, marginTop: 10, color: "var(--danger, #991b1b)" }}>{err}</div>}

            <div className="actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: busy ? "#9ca3af" : "#067D62",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!busy) {
                    e.currentTarget.style.background = "#055A4A";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!busy) {
                    e.currentTarget.style.background = "#067D62";
                  }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                {busy ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
