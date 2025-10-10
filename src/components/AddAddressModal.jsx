// src/components/AddAddressModal.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { createAddress, updateAddress, setDefaultAddress } from "../services/addressService";

export default function AddAddressModal({ isOpen, onClose, mode = "create", initialData = null, onSuccess }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "shipping",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    isDefault: false,
  });

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        // Edit mode: use all initialData
        setForm(initialData);
      } else if (mode === "create") {
        // Create mode: merge initialData (which may just have type) with defaults
        setForm({
          type: initialData?.type || "shipping",
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "US",
          isDefault: false,
        });
      }
      setError("");
    }
  }, [isOpen, initialData, mode]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  async function handleSave(e) {
    e.preventDefault();
    if (!user?.uid) return;

    // Validation
    if (!form.line1 || !form.city || !form.state || !form.postalCode) {
      setError("Please fill in all required fields (Address Line 1, City, State, Postal Code)");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (mode === "create") {
        const created = await createAddress(user.uid, form);
        if (form.isDefault) {
          await setDefaultAddress(user.uid, created.id, form.type);
        }
      } else {
        const updated = await updateAddress({ id: initialData.id, ...form });
        if (form.isDefault) {
          await setDefaultAddress(user.uid, updated.id, form.type);
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving address:", err);
      setError(err.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>
            {mode === "create" ? "Add Address" : "Edit Address"}
          </h3>
          <button className="btn btn-secondary btn-slim" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label className="field">
              <div className="meta">Type *</div>
              <select className="select" name="type" value={form.type} onChange={onChange}>
                <option value="shipping">Shipping</option>
                <option value="billing">Billing</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="field" style={{ display: "flex", alignItems: "center", paddingTop: 20 }}>
              <input
                type="checkbox"
                name="isDefault"
                checked={form.isDefault}
                onChange={onChange}
                style={{ marginRight: 8 }}
              />
              <span>Set as default</span>
            </label>

            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <div className="meta">Address Line 1 *</div>
              <input
                className="input"
                type="text"
                name="line1"
                value={form.line1}
                onChange={onChange}
                placeholder="123 Main St"
                autoFocus
                required
              />
            </label>

            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <div className="meta">Address Line 2</div>
              <input
                className="input"
                type="text"
                name="line2"
                value={form.line2}
                onChange={onChange}
                placeholder="Apt 4B (optional)"
              />
            </label>

            <label className="field">
              <div className="meta">City *</div>
              <input
                className="input"
                type="text"
                name="city"
                value={form.city}
                onChange={onChange}
                placeholder="San Francisco"
                required
              />
            </label>

            <label className="field">
              <div className="meta">State *</div>
              <input
                className="input"
                type="text"
                name="state"
                value={form.state}
                onChange={onChange}
                placeholder="CA"
                required
              />
            </label>

            <label className="field">
              <div className="meta">Postal Code *</div>
              <input
                className="input"
                type="text"
                name="postalCode"
                value={form.postalCode}
                onChange={onChange}
                placeholder="94102"
                required
              />
            </label>

            <label className="field">
              <div className="meta">Country</div>
              <input
                className="input"
                type="text"
                name="country"
                value={form.country}
                onChange={onChange}
                placeholder="US"
              />
            </label>
          </div>

          {error && (
            <div className="card" style={{ padding: 12, background: "#fee", border: "1px solid #fcc", color: "#c00", marginTop: 12 }}>
              {error}
            </div>
          )}

          <div className="actions" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={onClose} type="button" disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : mode === "create" ? "Add Address" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
