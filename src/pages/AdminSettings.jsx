// src/pages/AdminSettings.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getSettings, saveSettings, resetSettings } from "../services/settingsService";
import { COMMON_TIMEZONES } from "../services/timezoneService";
import { Save } from "lucide-react";

/* ------------------------------ tiny icon set ------------------------------ */
const IconStore = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 9l2-5h14l2 5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 9h16v10H4z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 19v-6h6v6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IconCard = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconTruck = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconPercent = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconShield = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* --------------------------------- modal ---------------------------------- */
function ConfirmModal({ open, title, message, confirmText = "Confirm", onConfirm, onClose, tone = "primary" }) {
  if (!open) return null;
  const toneStyles =
    tone === "danger"
      ? { btn: "btn btn-primary", card: { color: "var(--danger, #991b1b)" } }
      : { btn: "btn btn-primary", card: {} };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 520, width: "100%" }}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-secondary btn-slim" onClick={onClose}>Close</button>
        </div>
        <div className="card" style={{ padding: 12, ...toneStyles.card }}>{message}</div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={toneStyles.btn} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ stat widget ------------------------------- */
function StatCard({ icon, title, value, hint }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)" }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div className="meta">{title}</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
          {hint && <div className="meta">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */
export function AdminSettings() {
  const { user } = useAuth();

  const [tab, setTab] = useState("store");

  // Local UI state (stripe `sk` is local-only; we DO NOT persist it from the client)
  const [store, setStore] = useState({ 
    name: "", 
    email: "", 
    logo: "", 
    supportPhone: "",
    serverTimeZone: "America/Denver",
    supportHours: {
      monday: { isOpen: true, open: "09:00", close: "17:00" },
      tuesday: { isOpen: true, open: "09:00", close: "17:00" },
      wednesday: { isOpen: true, open: "09:00", close: "17:00" },
      thursday: { isOpen: true, open: "09:00", close: "17:00" },
      friday: { isOpen: true, open: "09:00", close: "17:00" },
      saturday: { isOpen: false, open: "10:00", close: "14:00" },
      sunday: { isOpen: false, open: "10:00", close: "14:00" },
    }
  });
  const [payments, setPayments] = useState({ 
    enableCards: true, 
    cod: false, 
    pk: "", 
    sk: "", 
    connected: false,
    acceptedMethods: ["card", "paypal", "apple_pay", "google_pay"]
  });
  const [shipping, setShipping] = useState({ base: 5, freeAt: 50 });
  const [taxes, setTaxes] = useState({ rate: 7.5, origin: "UT" });

  // UX flags
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [error, setError] = useState("");

  // Load from Firestore
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        if (!alive) return;
        // hydrate UI state (no `sk` in firestore; keep current local sk)
        setStore(data.store || { 
          name: "", 
          email: "", 
          logo: "", 
          supportPhone: "",
          supportHours: {
            monday: { isOpen: true, open: "09:00", close: "17:00" },
            tuesday: { isOpen: true, open: "09:00", close: "17:00" },
            wednesday: { isOpen: true, open: "09:00", close: "17:00" },
            thursday: { isOpen: true, open: "09:00", close: "17:00" },
            friday: { isOpen: true, open: "09:00", close: "17:00" },
            saturday: { isOpen: false, open: "10:00", close: "14:00" },
            sunday: { isOpen: false, open: "10:00", close: "14:00" },
          }
        });
        setPayments((prev) => ({
          enableCards: !!data.payments?.enableCards,
          cod: !!data.payments?.cod,
          pk: data.payments?.pk || "",
          sk: prev.sk || "", // keep whatever user typed locally
          connected: !!data.payments?.connected,
          acceptedMethods: data.payments?.acceptedMethods || ["card", "paypal", "apple_pay", "google_pay"],
        }));
        setShipping(data.shipping || { base: 5, freeAt: 50 });
        setTaxes(data.taxes || { rate: 7.5, origin: "UT" });
      } catch (e) {
        setError(e?.message || "Failed to load settings");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // derived widgets
  const widgets = useMemo(() => {
    const paymentsConnected = !!(payments.connected || payments.pk);
    return {
      storeOk: Boolean(store.name && store.email),
      paymentsConnected,
      shippingSummary: `$${Number(shipping.base).toFixed(2)} base • free ≥ $${Number(shipping.freeAt).toFixed(0)}`,
      taxSummary: `${Number(taxes.rate).toFixed(1)}% • ${taxes.origin || "—"}`,
    };
  }, [store, payments, shipping, taxes]);

  // Admin color palette - Green Theme
  const adminColors = {
    green: "#067D62",
    darkGreen: "#055A4A",
    darkBg: "#232F3E",
    lightBg: "#37475A",
    accentBlue: "#146EB4",
    textLight: "#FFFFFF",
    textDark: "#0F1111",
    borderLight: "#DDD",
    success: "#067D62",
    warning: "#F9C74F",
    danger: "#E53E3E",
  };
  
  // Enhanced box shadow styles
  const cardShadow = {
    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    transition: "all 0.3s cubic-bezier(.25,.8,.25,1)",
  };

  if (!user || user.role !== "admin") {
    return <div className="container" style={{ padding: 24 }}>Access denied.</div>;
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      await saveSettings(
        {
          store,
          payments: { 
            enableCards: payments.enableCards, 
            cod: payments.cod, 
            pk: payments.pk, 
            connected: payments.connected,
            acceptedMethods: payments.acceptedMethods
          },
          shipping,
          taxes,
        },
        { uid: user?.uid || null }
      );
      setConfirmOpen(true);
    } catch (e) {
      setError(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    try {
      setSaving(true);
      setError("");
      const data = await resetSettings({ uid: user?.uid || null });
      setStore(data.store);
      setPayments((prev) => ({ 
        ...data.payments, 
        sk: prev.sk || "",
        acceptedMethods: data.payments?.acceptedMethods || ["card", "paypal", "apple_pay", "google_pay"]
      }));
      setShipping(data.shipping);
      setTaxes(data.taxes);
      setDangerOpen(false);
    } catch (e) {
      setError(e?.message || "Failed to reset configuration");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
      <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Hero Headline with Title, Description, and Actions */}
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker">Admin</div>
            <h1 style={{ margin: 0 }}>Settings</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Configure store, payments, shipping, and taxes
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link 
              to="/admin" 
              className="btn btn-secondary"
              style={{
                fontSize: "13px",
                padding: "8px 14px",
                whiteSpace: "nowrap"
              }}
            >
              ← Back
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="btn btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                padding: "8px 14px",
                whiteSpace: "nowrap"
              }}
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

          {/* Error banner */}
          {error && (
            <div className="card" style={{ 
              padding: 10, 
              color: "var(--danger, #991b1b)", 
              marginBottom: 12,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              {error}
            </div>
          )}

        {/* Top widgets */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
        <StatCard icon={<IconStore />} title="Store profile" value={widgets.storeOk ? "Complete" : "Incomplete"} hint={store.name || "—"} />
        <StatCard icon={<IconCard />} title="Payments" value={widgets.paymentsConnected ? "Connected" : "Not connected"} hint={widgets.paymentsConnected ? "Payment gateway active" : "Setup required"} />
        <StatCard icon={<IconTruck />} title="Shipping" value={widgets.shippingSummary} />
        <StatCard icon={<IconPercent />} title="Taxes" value={widgets.taxSummary} />
          </div>

          {/* Consolidated Card: Tabs, Content, and Actions */}
          <div style={{ 
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            ...cardShadow
          }}>
            {/* Title - Tabs (Filters) - Stats Row */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              gap: 24, 
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "1px solid #e5e7eb"
            }}>
              {/* Title */}
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: adminColors.darkBg, minWidth: "130px" }}>Configuration</h2>
              
              {/* Tabs - Centered (act as filters) */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1, justifyContent: "center" }}>
                {[
                  ["store", "Store"],
                  ["payments", "Payments"],
                  ["shipping", "Shipping"],
                  ["taxes", "Taxes"],
                  ["security", "Security"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={`btn btn-secondary btn-slim ${tab === id ? "active" : ""}`}
                    onClick={() => setTab(id)}
                    type="button"
                    style={{
                      fontSize: "13px",
                      padding: "6px 12px",
                      background: tab === id ? adminColors.green : "transparent",
                      color: tab === id ? "#fff" : "#374151",
                      border: tab === id ? "none" : "1px solid #e5e7eb",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              {/* Stats - Current Section Info */}
              <div style={{ minWidth: "180px", textAlign: "right" }}>
                <div style={{ fontSize: "13px", color: "#718096", fontWeight: 600 }}>
                  {tab === "store" && widgets.storeOk ? "✓ Complete" : 
                   tab === "store" && !widgets.storeOk ? "⚠ Incomplete" :
                   tab === "payments" && widgets.paymentsConnected ? "✓ Connected" :
                   tab === "payments" && !widgets.paymentsConnected ? "⚠ Not Connected" :
                   tab === "shipping" ? widgets.shippingSummary :
                   tab === "taxes" ? widgets.taxSummary :
                   tab === "security" ? "Admin Only" : ""}
                </div>
              </div>
            </div>

            {/* Loading state */}
            {loading && <div style={{ padding: 20, textAlign: "center" }}>Loading settings…</div>}

            {/* Store */}
            {!loading && tab === "store" && (
              <section style={{ paddingTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Left Column: Store Settings */}
            <div>
              <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Store Information</div>
              <div className="grid" style={{ gap: 8 }}>
                <label className="field">
                  <div className="meta">Store name</div>
                  <input className="input" placeholder="My Store"
                    value={store.name} onChange={(e) => setStore(s => ({ ...s, name: e.target.value }))} />
                </label>
                <label className="field">
                  <div className="meta">Support email</div>
                  <input className="input" placeholder="support@example.com"
                    value={store.email} onChange={(e) => setStore(s => ({ ...s, email: e.target.value }))} />
                </label>
                <label className="field">
                  <div className="meta">Logo URL</div>
                  <input className="input" placeholder="https://…"
                    value={store.logo} onChange={(e) => setStore(s => ({ ...s, logo: e.target.value }))} />
                </label>
                <label className="field">
                  <div className="meta">Support Phone Number</div>
                  <input className="input" placeholder="(555) 123-4567"
                    value={store.supportPhone} onChange={(e) => setStore(s => ({ ...s, supportPhone: e.target.value }))} />
                </label>
                <label className="field">
                  <div className="meta">Server Time Zone</div>
                  <select 
                    className="input" 
                    value={store.serverTimeZone || "America/Denver"}
                    onChange={(e) => setStore(s => ({ ...s, serverTimeZone: e.target.value }))}
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label} ({tz.offset})
                      </option>
                    ))}
                  </select>
                  <div className="meta" style={{ fontSize: 11, marginTop: 4 }}>
                    All orders, tickets, and timestamps will be recorded in this timezone
                  </div>
                </label>
              </div>
            </div>
            
            {/* Right Column: Store Hours */}
            <div>
              <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Store Support Hours</div>
              <div style={{ display: "grid", gap: 8 }}>
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                  <div key={day} style={{ display: "grid", gridTemplateColumns: "90px 60px 1fr 1fr", gap: 6, alignItems: "center", fontSize: 13 }}>
                    <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{day}</div>
                    <label className="checkbox" style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={store.supportHours?.[day]?.isOpen ?? true}
                        onChange={(e) => setStore(s => ({
                          ...s,
                          supportHours: {
                            ...s.supportHours,
                            [day]: { ...s.supportHours[day], isOpen: e.target.checked }
                          }
                        }))}
                      />
                      <span className="meta" style={{ fontSize: 11 }}>Open</span>
                    </label>
                    <input
                      type="time"
                      className="input"
                      style={{ fontSize: 12, padding: "6px 8px" }}
                      value={store.supportHours?.[day]?.open ?? "09:00"}
                      disabled={!store.supportHours?.[day]?.isOpen}
                      onChange={(e) => setStore(s => ({
                        ...s,
                        supportHours: {
                          ...s.supportHours,
                          [day]: { ...s.supportHours[day], open: e.target.value }
                        }
                      }))}
                    />
                    <input
                      type="time"
                      className="input"
                      style={{ fontSize: 12, padding: "6px 8px" }}
                      value={store.supportHours?.[day]?.close ?? "17:00"}
                      disabled={!store.supportHours?.[day]?.isOpen}
                      onChange={(e) => setStore(s => ({
                        ...s,
                        supportHours: {
                          ...s.supportHours,
                          [day]: { ...s.supportHours[day], close: e.target.value }
                        }
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
              </section>
            )}

            {/* Payments */}
            {!loading && tab === "payments" && (
              <section style={{ paddingTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Left Column: Payment Options */}
            <div>
              <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Payment Options</div>
              <label className="checkbox" style={{ display: "block", marginBottom: 8 }}>
                <input type="checkbox" checked={payments.enableCards}
                  onChange={(e) => setPayments(p => ({ ...p, enableCards: e.target.checked }))} /> Enable credit cards
              </label>
              <label className="checkbox" style={{ display: "block", marginBottom: 8 }}>
                <input type="checkbox" checked={payments.cod}
                  onChange={(e) => setPayments(p => ({ ...p, cod: e.target.checked }))} /> Enable Cash on Delivery
              </label>
            </div>
            
            {/* Right Column: Accepted Methods */}
            <div>
              <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Accepted Payment Methods</div>
              <div className="meta" style={{ marginBottom: 8, fontSize: 12 }}>
                Select which payment methods customers can add and use:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label className="checkbox" style={{ display: "block" }}>
                <input 
                  type="checkbox" 
                  checked={payments.acceptedMethods?.includes("card")}
                  onChange={(e) => {
                    const methods = payments.acceptedMethods || [];
                    setPayments(p => ({ 
                      ...p, 
                      acceptedMethods: e.target.checked 
                        ? [...methods, "card"]
                        : methods.filter(m => m !== "card")
                    }));
                  }}
                /> 💳 Credit/Debit Cards
              </label>
              <label className="checkbox" style={{ display: "block" }}>
                <input 
                  type="checkbox" 
                  checked={payments.acceptedMethods?.includes("paypal")}
                  onChange={(e) => {
                    const methods = payments.acceptedMethods || [];
                    setPayments(p => ({ 
                      ...p, 
                      acceptedMethods: e.target.checked 
                        ? [...methods, "paypal"]
                        : methods.filter(m => m !== "paypal")
                    }));
                  }}
                /> 🔵 PayPal
              </label>
              <label className="checkbox" style={{ display: "block" }}>
                <input 
                  type="checkbox" 
                  checked={payments.acceptedMethods?.includes("apple_pay")}
                  onChange={(e) => {
                    const methods = payments.acceptedMethods || [];
                    setPayments(p => ({ 
                      ...p, 
                      acceptedMethods: e.target.checked 
                        ? [...methods, "apple_pay"]
                        : methods.filter(m => m !== "apple_pay")
                    }));
                  }}
                /> 🍎 Apple Pay
              </label>
              <label className="checkbox" style={{ display: "block" }}>
                <input 
                  type="checkbox" 
                  checked={payments.acceptedMethods?.includes("google_pay")}
                  onChange={(e) => {
                    const methods = payments.acceptedMethods || [];
                    setPayments(p => ({ 
                      ...p, 
                      acceptedMethods: e.target.checked 
                        ? [...methods, "google_pay"]
                        : methods.filter(m => m !== "google_pay")
                    }));
                  }}
                /> 🤖 Google Pay
              </label>
              </div>
            </div>
          </div>
              </section>
            )}

            {/* Shipping */}
            {!loading && tab === "shipping" && (
              <section style={{ paddingTop: 12 }}>
          <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Shipping Rates</div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label className="field">
              <div className="meta">Base rate ($)</div>
              <input className="input" type="number" min="0" step="0.01" value={shipping.base}
                onChange={(e) => setShipping(s => ({ ...s, base: Number(e.target.value) }))} />
            </label>
            <label className="field">
              <div className="meta">Free shipping threshold ($)</div>
              <input className="input" type="number" min="0" step="0.01" value={shipping.freeAt}
                onChange={(e) => setShipping(s => ({ ...s, freeAt: Number(e.target.value) }))} />
            </label>
          </div>
              </section>
            )}

            {/* Taxes */}
            {!loading && tab === "taxes" && (
              <section style={{ paddingTop: 12 }}>
          <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Tax Configuration</div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label className="field">
              <div className="meta">Default tax rate (%)</div>
              <input className="input" type="number" min="0" step="0.1" value={taxes.rate}
                onChange={(e) => setTaxes(t => ({ ...t, rate: Number(e.target.value) }))} />
            </label>
            <label className="field">
              <div className="meta">Origin state</div>
              <input className="input" placeholder="UT" value={taxes.origin}
                onChange={(e) => setTaxes(t => ({ ...t, origin: e.target.value }))} />
            </label>
          </div>
              </section>
            )}

            {/* Security / Danger Zone */}
            {!loading && tab === "security" && (
              <section style={{ paddingTop: 12 }}>
          <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Security & Maintenance</div>
          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 8 }}>
            <div className="card" style={{ padding: 12 }}>
              <h4 style={{ margin: "0 0 6px", color: "#991b1b" }}>Danger Zone</h4>
              <div className="meta">Reset settings to defaults (Firestore). Does not delete products/orders.</div>
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-primary" type="button" onClick={() => setDangerOpen(true)}>
                  Reset Configuration
                </button>
              </div>
            </div>
          </div>
              </section>
            )}

            {/* Bottom Actions Bar (inside card) */}
            {!loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    background: saving ? "#999" : adminColors.success,
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease",
                    opacity: saving ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.background = "#055A4A";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.background = adminColors.success;
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                    }
                  }}
                >
                  <Save size={14} />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </div>

        {/* Modals */}
        <ConfirmModal
          open={confirmOpen}
          title="Changes saved"
          message="Your settings have been saved to Firestore."
          confirmText="OK"
          onConfirm={() => setConfirmOpen(false)}
          onClose={() => setConfirmOpen(false)}
        />
        <ConfirmModal
          open={dangerOpen}
          title="Reset configuration"
          message="Are you sure you want to reset all settings to defaults? This cannot be undone."
          confirmText="Reset"
          onConfirm={handleReset}
          onClose={() => setDangerOpen(false)}
          tone="danger"
        />
      </div>
    </div>
  );
}
