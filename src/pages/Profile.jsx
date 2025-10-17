// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getUser, updateUser, deleteUser } from "../services/userService";
import { Home, Trash2 } from "lucide-react";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../services/addressService";
import {
  getUserPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "../services/paymentMethodService";
import { getSettings } from "../services/settingsService";
import { auth } from "../lib/firebase";
import {
  deleteUser as deleteAuthUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

function FullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // user profile form
  const [form, setForm] = useState({ firstName: "", lastName: "" });

  // addresses state
  const [addresses, setAddresses] = useState([]);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [addrMode, setAddrMode] = useState("create"); // create | edit
  const [activeAddr, setActiveAddr] = useState(null);
  const [addrDraft, setAddrDraft] = useState(emptyAddressDraft());

  // payment methods state
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({
    type: "card",
    label: "",
    last4: "",
    isDefault: false,
  });
  const [storePaymentSettings, setStorePaymentSettings] = useState({ enableCards: true, cod: false });

  function emptyAddressDraft(type = "shipping") {
    return {
      type, // "shipping" | "billing" | "other"
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      isDefault: false,
    };
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user) return;
      setErr("");
      setLoading(true);
      try {
        const [profile, addrs, payments, settings] = await Promise.all([
          getUser(user.uid), 
          getAddresses(user.uid),
          getUserPaymentMethods(user.uid),
          getSettings()
        ]);
        if (!alive) return;
        setForm({
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
        });
        setAddresses(Array.isArray(addrs) ? addrs : []);
        setPaymentMethods(Array.isArray(payments) ? payments : []);
        setStorePaymentSettings(settings?.payments || { enableCards: true, cod: false });
      } catch (e) {
        if (alive) setErr(e.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [user]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await updateUser({
        id: user.uid,
        firstName: form.firstName || "",
        lastName: form.lastName || "",
      });
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteAccount() {
    if (!confirm("This will permanently delete your account and data. Continue?")) return;
    setErr("");
    try {
      // Delete all user addresses (best effort, idempotent)
      try {
        const addrs = await getAddresses(user.uid);
        await Promise.all(addrs.map((a) => deleteAddress(a.id)));
      } catch {
        // Silently ignore address deletion errors - these are cleanup operations
      }
      // Remove user doc
      await deleteUser(user.uid);

      // Delete Auth user (may require re-auth)
      try {
        await deleteAuthUser(auth.currentUser);
      } catch (e) {
        if (e?.code === "auth/requires-recent-login") {
          const providerId = auth.currentUser.providerData?.[0]?.providerId;
          if (providerId === "google.com") {
            await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
          } else {
            const email = auth.currentUser.email;
            const pw = prompt("Please confirm your password to delete your account:");
            if (!pw) return;
            const cred = EmailAuthProvider.credential(email, pw);
            await reauthenticateWithCredential(auth.currentUser, cred);
          }
          await deleteAuthUser(auth.currentUser);
        } else {
          throw e;
        }
      }
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e.message || String(e));
    }
  }

  // -------- Address CRUD --------
  function openCreateAddress(type = "shipping") {
    setAddrMode("create");
    setActiveAddr(null);
    setAddrDraft(emptyAddressDraft(type));
    setAddrModalOpen(true);
  }
  function openEditAddress(addr) {
    setAddrMode("edit");
    setActiveAddr(addr);
    setAddrDraft({
      type: addr.type || "other",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "US",
      isDefault: !!addr.isDefault,
    });
    setAddrModalOpen(true);
  }
  async function saveAddress() {
    try {
      if (addrMode === "create") {
        const created = await createAddress(user.uid, addrDraft);
        setAddresses((prev) => [created, ...prev]);
        if (addrDraft.isDefault) await setDefaultAddress(user.uid, created.id, created.type);
      } else {
        const updated = await updateAddress({ id: activeAddr.id, ...addrDraft });
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        if (addrDraft.isDefault) await setDefaultAddress(user.uid, activeAddr.id, addrDraft.type);
      }
      setAddrModalOpen(false);
    } catch (e) {
      alert(e.message || String(e));
    }
  }
  async function removeAddress(addr) {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddress(addr.id);
      setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
    } catch (e) {
      alert(e.message || String(e));
    }
  }
  async function makeDefault(addr) {
    try {
      await setDefaultAddress(user.uid, addr.id, addr.type);
      // refresh
      const rows = await getAddresses(user.uid);
      setAddresses(rows);
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  // -------- Payment Method CRUD --------
  function openCreatePayment() {
    setPaymentDraft({
      type: storePaymentSettings.enableCards ? "card" : "cod",
      label: "",
      last4: "",
      isDefault: false,
    });
    setPaymentModalOpen(true);
  }
  
  async function savePaymentMethod() {
    try {
      if (!paymentDraft.label.trim()) {
        alert("Please provide a label for this payment method");
        return;
      }
      
      if (paymentDraft.type === "card" && !paymentDraft.last4) {
        alert("Please provide the last 4 digits of the card");
        return;
      }
      
      await addPaymentMethod(user.uid, {
        type: paymentDraft.type,
        label: paymentDraft.label,
        last4: paymentDraft.type === "card" ? paymentDraft.last4 : undefined,
        isDefault: paymentDraft.isDefault,
      });
      
      const updated = await getUserPaymentMethods(user.uid);
      setPaymentMethods(updated);
      setPaymentModalOpen(false);
    } catch (e) {
      alert(e.message || String(e));
    }
  }
  
  async function removePayment(method) {
    if (!confirm("Delete this payment method?")) return;
    try {
      await removePaymentMethod(user.uid, method.id);
      const updated = await getUserPaymentMethods(user.uid);
      setPaymentMethods(updated);
    } catch (e) {
      alert(e.message || String(e));
    }
  }
  
  async function makePaymentDefault(method) {
    try {
      await setDefaultPaymentMethod(user.uid, method.id);
      const updated = await getUserPaymentMethods(user.uid);
      setPaymentMethods(updated);
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  if (loading) return <div className="container" style={{ padding: 24 }}>Loading profile…</div>;

  // Get available payment types from store settings
  const storePaymentTypes = [];
  if (Array.isArray(storePaymentSettings.acceptedMethods) && storePaymentSettings.acceptedMethods.length > 0) {
    storePaymentTypes.push(...storePaymentSettings.acceptedMethods);
  } else {
    if (storePaymentSettings.enableCards) storePaymentTypes.push('card');
    if (storePaymentSettings.cod) storePaymentTypes.push('cod');
  }

  return (
    <main className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
      {/* Hero Headline */}
      <div className="hero-headline" style={{ marginBottom: 16 }}>
        <div>
          <div className="kicker">Account Settings</div>
          <h1 style={{ margin: 0 }}>Profile & Addresses</h1>
          <div className="meta" style={{ marginTop: 8 }}>
            Manage your personal information, addresses, and payment methods. Signed in as {user?.email}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link 
            to="/dashboard" 
            className="btn btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              whiteSpace: "nowrap"
            }}
          >
            ← Back to Dashboard
          </Link>
          <Link 
            to="/" 
            className="btn btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Home style={{ width: 16, height: 16 }} />
            Store
          </Link>
          <button 
            onClick={onDeleteAccount} 
            className="btn btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fee",
              borderColor: "#fcc",
              color: "#991b1b"
            }}
          >
            <Trash2 style={{ width: 16, height: 16 }} />
            Delete Account
          </button>
        </div>
      </div>

      <section className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
        {/* Profile card */}
        <form className="card grid" onSubmit={onSaveProfile}>
          <h3 style={{ margin: 0 }}>Profile</h3>
          <label className="field">
            <div className="meta">First name</div>
            <input className="input" name="firstName" value={form.firstName} onChange={onChange} placeholder="Jane" />
          </label>
          <label className="field">
            <div className="meta">Last name</div>
            <input className="input" name="lastName" value={form.lastName} onChange={onChange} placeholder="Doe" />
          </label>
          <label className="field">
            <div className="meta">Email</div>
            <input className="input" value={user.email || ""} disabled />
          </label>

          {err && <div className="card" style={{ padding: 8, color: "var(--danger, #991b1b)" }}>{err}</div>}

          <div className="actions" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        {/* Payment Methods card */}
        <div className="card">
          <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Payment Methods</h3>
            {storePaymentTypes.length > 0 && (
              <button className="btn btn-secondary btn-slim" onClick={openCreatePayment}>
                + Add Payment Method
              </button>
            )}
          </div>

          {storePaymentTypes.length === 0 ? (
            <div className="card" style={{ padding: 12, background: "#fff7e6" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>No payment methods available in store settings.</p>
            </div>
          ) : !paymentMethods.length ? (
            <div className="card" style={{ padding: 12, color: "var(--muted)" }}>
              No payment methods on file. Click "Add Payment Method" to add one.
            </div>
          ) : (
            <div className="grid" style={{ gap: 8 }}>
              {paymentMethods.map((method) => {
                const isAvailable = storePaymentTypes.includes(method.type);
                return (
                  <div 
                    key={method.id} 
                    className="card" 
                    style={{ 
                      padding: 12, 
                      opacity: isAvailable ? 1 : 0.6,
                      border: isAvailable ? "1px solid var(--border)" : "1px dashed #ccc"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div className="pill">{method.type === "card" ? "Card" : "COD"}</div>
                          {method.isDefault && (
                            <div className="pill" style={{ background: "#eaf8f0", color: "#065f46" }}>Default</div>
                          )}
                          {!isAvailable && (
                            <div className="pill" style={{ background: "#fff7e6", color: "#8a5a00" }}>Unavailable</div>
                          )}
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {method.label}
                          {method.last4 && <span className="meta" style={{ marginLeft: 8 }}>****{method.last4}</span>}
                        </div>
                        <div className="meta">
                          {method.type === "card" ? "Credit/Debit Card" : "Cash on Delivery"}
                          {!isAvailable && " • No longer available in store"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {!method.isDefault && isAvailable && (
                          <button 
                            className="btn btn-secondary btn-slim" 
                            onClick={() => makePaymentDefault(method)}
                          >
                            Make default
                          </button>
                        )}
                        <button 
                          className="btn btn-secondary btn-slim" 
                          onClick={() => removePayment(method)}
                          style={{ background: "#fee", border: "1px solid #fcc" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Addresses card */}
        <div className="card">
          <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Addresses</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-slim" onClick={() => openCreateAddress("shipping")}>Add Shipping</button>
              <button className="btn btn-secondary btn-slim" onClick={() => openCreateAddress("billing")}>Add Billing</button>
            </div>
          </div>

          {!addresses.length && (
            <div className="card" style={{ padding: 12, color: "var(--muted)" }}>No addresses on file</div>
          )}

          <div className="grid" style={{ gap: 8 }}>
            {addresses.map((a) => (
              <div key={a.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <div>
                    <div className="pill" style={{ marginBottom: 6 }}>{a.type || "other"}</div>
                    <div style={{ fontWeight: 700 }}>{FullName({ firstName: form.firstName, lastName: form.lastName }) || "—"}</div>
                    <div className="meta">
                      {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country}
                    </div>
                    {a.isDefault && <div className="meta" style={{ color: "var(--success, #166534)" }}>Default</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!a.isDefault && (
                      <button className="btn btn-secondary btn-slim" onClick={() => makeDefault(a)}>
                        Make default
                      </button>
                    )}
                    <button className="btn btn-secondary btn-slim" onClick={() => openEditAddress(a)}>
                      Edit
                    </button>
                    <button className="btn btn-secondary btn-slim" onClick={() => removeAddress(a)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Address Modal */}
      {addrModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 560, width: "100%" }}>
            <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>
                {addrMode === "create" ? "Add Address" : "Edit Address"}
              </h3>
              <button className="btn btn-secondary btn-slim" onClick={() => setAddrModalOpen(false)}>Close</button>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label className="field">
                <div className="meta">Type</div>
                <select
                  className="select"
                  value={addrDraft.type}
                  onChange={(e) => setAddrDraft((d) => ({ ...d, type: e.target.value }))}
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="field">
                <div className="meta">Default</div>
                <select
                  className="select"
                  value={addrDraft.isDefault ? "yes" : "no"}
                  onChange={(e) => setAddrDraft((d) => ({ ...d, isDefault: e.target.value === "yes" }))}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>

              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Address line 1</div>
                <input className="input" value={addrDraft.line1} onChange={(e) => setAddrDraft((d) => ({ ...d, line1: e.target.value }))} />
              </label>

              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Address line 2</div>
                <input className="input" value={addrDraft.line2} onChange={(e) => setAddrDraft((d) => ({ ...d, line2: e.target.value }))} />
              </label>

              <label className="field">
                <div className="meta">City</div>
                <input className="input" value={addrDraft.city} onChange={(e) => setAddrDraft((d) => ({ ...d, city: e.target.value }))} />
              </label>
              <label className="field">
                <div className="meta">State</div>
                <input className="input" value={addrDraft.state} onChange={(e) => setAddrDraft((d) => ({ ...d, state: e.target.value }))} />
              </label>
              <label className="field">
                <div className="meta">Postal code</div>
                <input className="input" value={addrDraft.postalCode} onChange={(e) => setAddrDraft((d) => ({ ...d, postalCode: e.target.value }))} />
              </label>
              <label className="field">
                <div className="meta">Country</div>
                <input className="input" value={addrDraft.country} onChange={(e) => setAddrDraft((d) => ({ ...d, country: e.target.value }))} />
              </label>
            </div>

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setAddrModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAddress}>
                {addrMode === "create" ? "Create Address" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {paymentModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 480, width: "100%" }}>
            <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Add Payment Method</h3>
              <button className="btn btn-secondary btn-slim" onClick={() => setPaymentModalOpen(false)}>Close</button>
            </div>

            <div className="grid" style={{ gap: 12 }}>
              <label className="field">
                <div className="meta" style={{ fontWeight: 600 }}>Payment Type *</div>
                <select
                  className="select"
                  value={paymentDraft.type}
                  onChange={(e) => setPaymentDraft(d => ({ ...d, type: e.target.value }))}
                >
                  {storePaymentTypes.includes('card') && <option value="card">Credit / Debit Card</option>}
                  {storePaymentTypes.includes('paypal') && <option value="paypal">PayPal</option>}
                  {storePaymentTypes.includes('apple_pay') && <option value="apple_pay">Apple Pay</option>}
                  {storePaymentTypes.includes('google_pay') && <option value="google_pay">Google Pay</option>}
                  {storePaymentTypes.includes('cod') && <option value="cod">Cash on Delivery</option>}
                </select>
              </label>

              <label className="field">
                <div className="meta" style={{ fontWeight: 600 }}>Label (e.g., "Personal Visa") *</div>
                <input
                  className="input"
                  placeholder="My Credit Card"
                  value={paymentDraft.label}
                  onChange={(e) => setPaymentDraft(d => ({ ...d, label: e.target.value }))}
                />
              </label>

              {paymentDraft.type === "card" && (
                <label className="field">
                  <div className="meta" style={{ fontWeight: 600 }}>Last 4 Digits *</div>
                  <input
                    className="input"
                    placeholder="1234"
                    maxLength="4"
                    value={paymentDraft.last4}
                    onChange={(e) => setPaymentDraft(d => ({ ...d, last4: e.target.value.replace(/\D/g, '') }))}
                  />
                </label>
              )}

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={paymentDraft.isDefault}
                  onChange={(e) => setPaymentDraft(d => ({ ...d, isDefault: e.target.checked }))}
                />
                <span>Set as default payment method</span>
              </label>
            </div>

            <div className="actions" style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePaymentMethod}>Add Payment Method</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
