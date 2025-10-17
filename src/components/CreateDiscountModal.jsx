// src/components/CreateDiscountModal.jsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCategories, categoryLabel } from "../services/productService";

/**
 * Modal for creating a new discount code
 * Props:
 * - open: boolean
 * - onClose(): void
 * - onSave(discountDraft): Promise<void>
 */
export default function CreateDiscountModal({ open, onClose, onSave }) {
  const [draft, setDraft] = useState({
    code: "",
    type: "percent",
    value: 10,
    active: true,
    category: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Fetch active categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["discount-categories"],
    queryFn: getCategories,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setErr("");
    setBusy(false);
    setDraft({
      code: "",
      type: "percent",
      value: 10,
      active: true,
      category: "",
    });
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e?.preventDefault?.();
    const code = draft.code.trim().toUpperCase().replace(/\s/g, "");
    if (!code) {
      setErr("Discount code is required.");
      return;
    }
    if (draft.type !== "shipping" && (!draft.value || Number(draft.value) <= 0)) {
      setErr("Value must be greater than 0.");
      return;
    }
    
    // Map modal types to service types
    const typeMapping = {
      "percent": "percentage",
      "amount": "fixed",
      "shipping": "free_shipping"
    };
    
    try {
      setBusy(true);
      await onSave?.({
        code,
        type: typeMapping[draft.type] || draft.type,
        value: Number(draft.value) || 0,
        isActive: !!draft.active, // Use isActive not active
        category: draft.category || null,
        scope: draft.category ? "category" : "site-wide",
        usageCount: 0,
      });
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Failed to create discount code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Create Discount Code</h3>
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

        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
            <label className="field">
              <div className="meta">Discount Code *</div>
              <input
                className="input"
                placeholder="SUMMER2024"
                value={draft.code}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    code: e.target.value.toUpperCase().replace(/\s/g, ""),
                  }))
                }
                autoFocus
                style={{ padding: "6px 10px", fontSize: "13px" }}
              />
            </label>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label className="field">
                <div className="meta">Type</div>
                <select
                  className="select"
                  value={draft.type}
                  onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                >
                  <option value="percent">Percentage Off</option>
                  <option value="amount">Fixed Amount Off</option>
                  <option value="shipping">Free Shipping</option>
                </select>
              </label>

              <label className="field">
                <div className="meta">Value *</div>
                <input
                  className="input"
                  type="number"
                  step="1"
                  min="0"
                  value={draft.value}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, value: Number(e.target.value) }))
                  }
                  disabled={draft.type === "shipping"}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                />
              </label>
            </div>

            <label className="field">
              <div className="meta">Category (Optional)</div>
              <select
                className="select"
                value={draft.category || ""}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                disabled={loadingCategories}
                style={{ padding: "6px 10px", fontSize: "13px" }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(cat)}
                  </option>
                ))}
              </select>
              <div className="meta" style={{ marginTop: 4, fontSize: 12 }}>
                Leave blank to apply to all products
              </div>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, active: e.target.checked }))
                }
              />
              <span>Active (code can be used immediately)</span>
            </label>
          </div>

          {err && (
            <div
              className="card"
              style={{
                padding: 8,
                marginTop: 10,
                color: "var(--danger, #991b1b)",
                background: "rgba(239, 68, 68, 0.1)",
              }}
            >
              {err}
            </div>
          )}

          <div className="actions" style={{ marginTop: 16 }}>
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
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              {busy ? "Creating…" : "Create Discount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
