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
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 560, width: "100%" }}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>
            {isCreate && "Add User"}
            {isEdit && "Edit User"}
            {isDelete && "Delete User"}
          </h3>
          <button className="btn btn-secondary btn-slim" onClick={onClose} disabled={busy}>Close</button>
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
              <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDelete} disabled={busy}>
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
                />
              </label>

              <label className="field">
                <div className="meta">Last name</div>
                <input
                  className="input"
                  placeholder="Doe"
                  value={draft.lastName}
                  onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
                />
              </label>

              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Email</div>
                <input
                  className="input"
                  placeholder="jane@example.com"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                />
              </label>

              <label className="field">
                <div className="meta">Role</div>
                <select
                  className="select"
                  value={draft.role}
                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                >
                  <option value="customer">Customer</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>

            {err && <div className="card" style={{ padding: 8, marginTop: 10, color: "var(--danger, #991b1b)" }}>{err}</div>}

            <div className="actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
