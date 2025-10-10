// src/pages/AdminSettings.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { getSettings, saveSettings, resetSettings } from "../services/settingsService";
import BreadcrumbNav from '../components/BreadcrumbNav';
import { Save } from "lucide-react";
import { useTotalHeaderHeight } from "../hooks/useTotalHeaderHeight";

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
  const { totalHeaderHeight } = useTotalHeaderHeight();

  const [tab, setTab] = useState("store");

  // Local UI state (stripe `sk` is local-only; we DO NOT persist it from the client)
  const [store, setStore] = useState({ 
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
    <>
      <BreadcrumbNav
        currentPage="Settings"
        backButton={{ label: "Back to Dashboard", path: "/admin" }}
        rightActions={
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)",
            padding: "6px 10px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0, 113, 133, 0.15)"
          }}>
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={saving || loading}
              style={{
                background: "none",
                border: "none",
                color: saving || loading ? "#999" : "#00695c",
                fontSize: 13,
                cursor: saving || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                borderRadius: 6,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => !saving && !loading && (e.target.style.background = "rgba(255, 255, 255, 0.4)")}
              onMouseLeave={(e) => e.target.style.background = "none"}
            >
              <Save style={{ width: 16, height: 16 }} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        }
      />
      
      <div className="container-xl" style={{ paddingTop: totalHeaderHeight, paddingBottom: 24 }}>
        <div className="hero-headline" style={{ marginBottom: 8, marginTop: -8 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 0 }}>Admin</div>
            <h1 style={{ margin: 0 }}>Settings</h1>
          </div>
        </div>

      {/* Error banner */}
      {error && (
        <div className="card" style={{ padding: 10, color: "var(--danger, #991b1b)", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Top widgets */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8, marginBottom: 12 }}>
        <StatCard icon={<IconStore />} title="Store profile" value={widgets.storeOk ? "Complete" : "Incomplete"} hint={store.name || "—"} />
        <StatCard icon={<IconCard />} title="Payments" value={widgets.paymentsConnected ? "Connected" : "Not connected"} hint={widgets.paymentsConnected ? "Stripe active" : "Stripe needed"} />
        <StatCard icon={<IconTruck />} title="Shipping" value={widgets.shippingSummary} />
        <StatCard icon={<IconPercent />} title="Taxes" value={widgets.taxSummary} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
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
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && <div className="card" style={{ padding: 12 }}>Loading settings…</div>}

      {/* Store */}
      {!loading && tab === "store" && (
        <section className="card" style={{ padding: 12 }}>
          <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Store</h3>
            <span className="pill">{widgets.storeOk ? "Complete" : "Incomplete"}</span>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Left Column: Store Settings */}
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 16 }}>Store Information</h4>
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
              </div>
            </div>
            
            {/* Right Column: Store Hours */}
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 16 }}>Store Support Hours</h4>
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
        <section className="card" style={{ padding: 12 }}>
          <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Payments</h3>
            <span className="pill" style={{ ...(payments.connected || payments.pk ? {} : { background: "#fff7e6", border: "1px solid #ffd8a8", color: "#8a5a00" }) }}>
              {payments.connected || payments.pk ? "Connected" : "Not connected"}
            </span>
          </div>
          <label className="checkbox" style={{ display: "block", marginBottom: 8 }}>
            <input type="checkbox" checked={payments.enableCards}
              onChange={(e) => setPayments(p => ({ ...p, enableCards: e.target.checked }))} /> Enable credit cards
          </label>
          <label className="checkbox" style={{ display: "block", marginBottom: 16 }}>
            <input type="checkbox" checked={payments.cod}
              onChange={(e) => setPayments(p => ({ ...p, cod: e.target.checked }))} /> Enable Cash on Delivery
          </label>
          
          <div style={{ marginBottom: 8 }}>
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
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <label className="field">
              <div className="meta">Stripe Publishable Key</div>
              <input className="input" placeholder="pk_live_…" value={payments.pk}
                onChange={(e) => setPayments(p => ({ ...p, pk: e.target.value }))} />
            </label>
            <label className="field">
              <div className="meta">Stripe Secret Key (local only)</div>
              <input className="input" placeholder="sk_live_…" value={payments.sk}
                onChange={(e) => setPayments(p => ({ ...p, sk: e.target.value }))} />
            </label>
          </div>
          <div className="card" style={{ marginTop: 10, padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <IconShield />
            <div className="meta">
              Secret keys are <strong>not saved to Firestore</strong>. Store them in server-side config/Secret Manager and set
              <code> payments.connected </code> via a secure admin flow.
            </div>
          </div>
        </section>
      )}

      {/* Shipping */}
      {!loading && tab === "shipping" && (
        <section className="card" style={{ padding: 12 }}>
          <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Shipping</h3>
            <span className="pill">{`Base $${Number(shipping.base).toFixed(2)} • Free ≥ $${Number(shipping.freeAt).toFixed(0)}`}</span>
          </div>
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
        <section className="card" style={{ padding: 12 }}>
          <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Taxes</h3>
            <span className="pill">{`${Number(taxes.rate).toFixed(1)}% • ${taxes.origin || "—"}`}</span>
          </div>
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
        <section className="card" style={{ padding: 12 }}>
          <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Security & Maintenance</h3>
            <span className="pill">Admin actions</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="card" style={{ padding: 12 }}>
              <h4 style={{ margin: "0 0 6px" }}>Rotate Stripe Keys</h4>
              <div className="meta">Rotate keys server-side, then mark connection as active.</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setPayments(p => ({ ...p, connected: true }))}
                >
                  Mark Connected
                </button>
              </div>
            </div>
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

      {/* Bottom-right sticky Save bar */}
      {!loading && (
        <div
          className="save-bar"
          style={{
            position: "sticky",
            bottom: 12,
            marginTop: 12,
            zIndex: 5,
          }}
        >
          <div
            className="card"
            style={{
              padding: 10,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            <button
              className="btn btn-secondary btn-slim"
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

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
    </>
  );
}
