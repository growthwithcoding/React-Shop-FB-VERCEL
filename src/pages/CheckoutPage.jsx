import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectCartItems, selectTotalPrice } from "../features/cart/selectors.js";
import { clear } from "../features/cart/cartSlice.js";
import { formatPrice } from "../utils/money.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { createOrder } from "../services/orderService";
import { getAddresses, createAddress } from "../services/addressService";
import { getSettings } from "../services/settingsService";
import {
  getDiscountByCode, 
  getSavedDiscountCodes, 
  clearSavedDiscountCodes,
  removeSavedDiscountCode,
  applyMultipleDiscounts,
  validateDiscount
} from "../services/discountService";
import { getUserPaymentMethods, addPaymentMethod, setDefaultPaymentMethod } from "../services/paymentMethodService";
import emailjs from "emailjs-com";

const FALLBACK = "https://via.placeholder.com/80?text=No+Image";

/**
 * Checkout page that uses Firestore settings for shipping & payments,
 * and supports discount codes stored in Firestore.
 */
export default function CheckoutPage() {
  // const totalHeaderHeight = useTotalHeaderHeight(); // Not used in this component
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectTotalPrice);

  const [coupon, setCoupon] = useState("");
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);

  // Settings for shipping and payments
  const [shippingSettings, setShippingSettings] = useState({ base: 5, freeAt: 50 });
  const [paymentsSettings, setPaymentsSettings] = useState({ enableCards: true, cod: false });
  
  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [userPaymentMethods, setUserPaymentMethods] = useState([]);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentDraft, setNewPaymentDraft] = useState({
    type: "card",
    label: "",
    last4: "",
    isDefault: false,
  });

  // address selection
  const [addresses, setAddresses] = useState([]);
  const [shippingId, setShippingId] = useState("");
  const [billingId, setBillingId] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(false);

  // quick-add address modal
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrType, setAddrType] = useState("shipping");
  const [addrDraft, setAddrDraft] = useState({
    type: "shipping",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    isDefault: false,
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useDispatch();

  // toast near coupon
  const [toast, setToast] = useState({ open: false, msg: "", kind: "success" });
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((s) => ({ ...s, open: false })), 1800);
    return () => clearTimeout(t);
  }, [toast.open]);
  const showToast = (msg, kind = "success") => setToast({ open: true, msg, kind });

  // Load addresses and default selections
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user?.uid) return;
      const rows = await getAddresses(user.uid);
      if (!alive) return;
      setAddresses(rows);
      const defShip = rows.find((a) => a.type === "shipping" && a.isDefault) || rows.find((a) => a.type === "shipping");
      const defBill = rows.find((a) => a.type === "billing" && a.isDefault) || rows.find((a) => a.type === "billing");
      setShippingId(defShip?.id || "");
      setBillingId(defBill?.id || "");
    }
    load();
    return () => { alive = false; };
  }, [user?.uid]);

  // Auto-apply saved discount codes on mount
  useEffect(() => {
    let alive = true;
    async function autoApplySavedDiscounts() {
      console.log('CheckoutPage: Starting auto-apply...');
      const savedCodes = getSavedDiscountCodes();
      console.log('CheckoutPage: Saved codes:', savedCodes);
      
      if (savedCodes.length === 0) {
        console.log('CheckoutPage: No saved codes found');
        return;
      }

      const validDiscounts = [];
      for (const code of savedCodes) {
        console.log(`CheckoutPage: Processing code ${code}`);
        try {
          const disc = await getDiscountByCode(code);
          console.log(`CheckoutPage: Discount found for ${code}:`, disc);
          
          if (disc) {
            const validation = validateDiscount(disc, subtotal, items);
            console.log(`CheckoutPage: Validation result for ${code}:`, validation);
            
            if (validation.valid) {
              validDiscounts.push(disc);
              console.log(`CheckoutPage: ${code} is valid, added to list`);
            } else {
              console.log(`CheckoutPage: ${code} is invalid: ${validation.reason}`);
              // Remove invalid codes
              removeSavedDiscountCode(code);
            }
          } else {
            console.log(`CheckoutPage: ${code} doesn't exist in Firestore`);
            // Remove codes that don't exist
            removeSavedDiscountCode(code);
          }
        } catch (err) {
          console.error(`CheckoutPage: Error loading discount ${code}:`, err);
          removeSavedDiscountCode(code);
        }
      }

      console.log('CheckoutPage: Valid discounts found:', validDiscounts);
      
      if (!alive) return;
      if (validDiscounts.length > 0) {
        setAppliedDiscounts(validDiscounts);
        showToast(`${validDiscounts.length} saved discount code${validDiscounts.length > 1 ? 's' : ''} applied!`, "success");
        console.log('CheckoutPage: Applied discounts set');
      } else {
        console.log('CheckoutPage: No valid discounts to apply');
      }
    }

    autoApplySavedDiscounts();
    return () => { alive = false; };
  }, [items, subtotal]);

  // Load shipping and payment settings
  useEffect(() => {
    let alive = true;
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (!alive) return;
        setShippingSettings(settings.shipping || { base: 5, freeAt: 50 });
        setPaymentsSettings(settings.payments || { enableCards: true, cod: false });
      } catch (err) {
        console.error("Error loading settings:", err);
        if (!alive) return;
        setPaymentsSettings({ enableCards: true, cod: false });
      }
    }
    loadSettings();
    return () => { alive = false; };
  }, []);

  // Load user's saved payment methods
  useEffect(() => {
    let alive = true;
    async function loadPaymentMethods() {
      if (!user?.uid) return;
      
      try {
        const methods = await getUserPaymentMethods(user.uid);
        if (!alive) return;
        setUserPaymentMethods(methods);
        
        // Set default payment method
        const defaultMethod = methods.find(m => m.isDefault);
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod.id);
        } else if (methods.length > 0) {
          setSelectedPaymentMethod(methods[0].id);
        }
      } catch (err) {
        console.error("Error loading payment methods:", err);
      }
    }
    loadPaymentMethods();
    return () => { alive = false; };
  }, [user?.uid]);

  // Normalize coupon code and apply via Firestore lookup
  const normalizeCode = (code) => (code || "").trim().toUpperCase();
  async function applyCoupon() {
    const norm = normalizeCode(coupon);
    if (!norm) {
      showToast("Enter a coupon code first.", "error");
      return;
    }

    // Check if code is already applied
    if (appliedDiscounts.some(d => d.code === norm)) {
      showToast("This code is already applied.", "error");
      return;
    }

    try {
      const disc = await getDiscountByCode(norm);
      if (!disc) {
        showToast("Invalid coupon code.", "error");
        return;
      }

      // Validate the discount
      const validation = validateDiscount(disc, subtotal, items);
      if (!validation.valid) {
        showToast(validation.reason, "error");
        return;
      }

      // Add to applied discounts
      setAppliedDiscounts(prev => [...prev, disc]);
      setCoupon("");
      
      let msg = "";
      if (disc.type === "percentage") {
        msg = `${disc.code} applied: ${disc.value}% off 🎉`;
      } else if (disc.type === "fixed") {
        msg = `${disc.code} applied: $${disc.value} off 🎉`;
      } else if (disc.type === "free_shipping") {
        msg = `${disc.code} applied: Free shipping 🎉`;
      }
      showToast(msg, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to apply discount.", "error");
    }
  }

  // Remove a discount code
  function removeDiscount(code) {
    setAppliedDiscounts(prev => prev.filter(d => d.code !== code));
    removeSavedDiscountCode(code);
    showToast(`${code} removed`, "success");
  }

  // Compute shipping cost based on settings and subtotal
  const shippingCost = items.length
    ? subtotal >= (shippingSettings.freeAt ?? 50)
      ? 0
      : (shippingSettings.base ?? 5)
    : 0;

  // Apply multiple discounts with stacking logic
  const discountResult = applyMultipleDiscounts(appliedDiscounts, subtotal, shippingCost, items);
  const discountAmount = discountResult.totalDiscount;

  const total = Math.max(subtotal + shippingCost - discountAmount, 0);

  async function placeOrder(e) {
    e.preventDefault();
    if (!user?.uid) return alert("You must be signed in to place an order.");
    if (!shippingId || !billingId) return alert("Please select a shipping and billing address.");

    try {
      const newOrder = await createOrder({
        userId: user.uid,
        items,
        subtotal,
        delivery: shippingCost,
        discount: discountAmount,
        appliedDiscountCodes: appliedDiscounts.map(d => d.code),
        total,
        shippingAddressId: shippingId,
        billingAddressId: billingId,
      });

      // Clear saved discount codes after successful order
      clearSavedDiscountCodes();

      // Send order confirmation email
      try {
        const itemsList = items.map(item => 
          `${item.title} (Qty: ${item.quantity}) - ${formatPrice(item.price * item.quantity)}`
        ).join('\n');

        await emailjs.send(
          "growthwithcoding",
          "template_order_conf",
          {
            to_email: user.email,
            to_name: user.displayName || user.email,
            order_id: newOrder.id,
            order_date: new Date().toLocaleDateString(),
            items_list: itemsList,
            subtotal: formatPrice(subtotal),
            delivery: formatPrice(shippingCost),
            discount: formatPrice(discountAmount),
            total: formatPrice(total),
          },
          "kUx5fdVefCjNVQZUS"
        );
      } catch (emailErr) {
        // Don't block the order flow if email fails
        console.error("Failed to send confirmation email:", emailErr);
      }

      dispatch(clear());
      navigate(`/order-confirmation?orderId=${newOrder.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to place order: " + err.message);
    }
  }

  function openQuickAdd(type) {
    setAddrType(type);
    setAddrDraft({
      type,
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      isDefault: false,
    });
    setAddrOpen(true);
  }
  async function saveQuickAdd() {
    try {
      const created = await createAddress(user.uid, addrDraft);
      const rows = await getAddresses(user.uid);
      setAddresses(rows);
      if (addrDraft.type === "shipping") setShippingId(created.id);
      if (addrDraft.type === "billing") setBillingId(created.id);
      setAddrOpen(false);
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  // ---------- Empty state ----------
  if (items.length === 0) {
    return (
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker">Complete Your Order</div>
            <h1 style={{ margin: 0 }}>Secure Checkout</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Your cart is empty. Add items to proceed with checkout.
            </div>
          </div>
          <Link 
            to="/cart" 
            className="btn btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              whiteSpace: "nowrap"
            }}
          >
            ← Back to Cart
          </Link>
        </div>
          <section className="card" style={{ textAlign: "center", padding: "28px 24px", borderRadius: 12, boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
            <p style={{ marginBottom: 16 }}>
              Trying to check out with <strong>zero</strong> items? That's a bold new budgeting strategy. 😄
            </p>
            <Link to="/" className="btn btn-primary" style={{ display: "inline-block", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
              Browse Products
            </Link>
          </section>
        </main>
    );
  }

  // Get available payment options from store settings
  const storePaymentTypes = [];
  
  // Check acceptedMethods array first (new format from settings)
  if (Array.isArray(paymentsSettings.acceptedMethods) && paymentsSettings.acceptedMethods.length > 0) {
    storePaymentTypes.push(...paymentsSettings.acceptedMethods);
  } else {
    // Fallback to old format
    if (paymentsSettings.enableCards) storePaymentTypes.push('card');
    if (paymentsSettings.cod) storePaymentTypes.push('cod');
  }
  
  // Map payment type IDs to friendly labels
  const paymentLabels = {
    card: "Credit / Debit Card",
    paypal: "PayPal",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cod: "Cash on Delivery",
  };
  
  // Combine user's saved methods with store payment options
  const userSavedTypes = userPaymentMethods.map(m => m.type);
  const storeOnlyPayments = storePaymentTypes
    .filter(type => !userSavedTypes.includes(type))
    .map(type => ({
      id: `store_${type}`,
      type: type,
      label: paymentLabels[type] || type,
      isStoreDefault: true,
    }));
  
  const userMethodsWithStatus = userPaymentMethods.map(method => ({
    ...method,
    disabled: !storePaymentTypes.includes(method.type)
  }));
  
  const availableUserMethods = [...userMethodsWithStatus, ...storeOnlyPayments];

  async function handleAddPaymentMethod() {
    if (!user?.uid) {
      alert("Please sign in to add payment methods");
      return;
    }
    
    if (!newPaymentDraft.label.trim()) {
      alert("Please provide a label for this payment method");
      return;
    }
    
    if (newPaymentDraft.type === "card" && !newPaymentDraft.last4) {
      alert("Please provide the last 4 digits of the card");
      return;
    }
    
    try {
      const created = await addPaymentMethod(user.uid, {
        type: newPaymentDraft.type,
        label: newPaymentDraft.label,
        last4: newPaymentDraft.type === "card" ? newPaymentDraft.last4 : undefined,
        isDefault: newPaymentDraft.isDefault,
      });
      
      const updated = await getUserPaymentMethods(user.uid);
      setUserPaymentMethods(updated);
      setSelectedPaymentMethod(created.id);
      setShowAddPaymentModal(false);
      setNewPaymentDraft({ type: "card", label: "", last4: "", isDefault: false });
    } catch (err) {
      console.error("Error adding payment method:", err);
      alert("Failed to add payment method: " + err.message);
    }
  }

  async function handleSetDefault(methodId) {
    if (!user?.uid) return;
    
    try {
      await setDefaultPaymentMethod(user.uid, methodId);
      const updated = await getUserPaymentMethods(user.uid);
      setUserPaymentMethods(updated);
    } catch (err) {
      console.error("Error setting default:", err);
      alert("Failed to set default payment method");
    }
  }

  return (
    <div className="container grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 24, paddingBottom: 24 }}>
      <div className="hero-headline" style={{ marginBottom: 16, gridColumn: "1 / -1" }}>
        <div>
          <div className="kicker">Complete Your Order</div>
          <h1 style={{ margin: 0 }}>Secure Checkout</h1>
          <div className="meta" style={{ marginTop: 8 }}>
            Review your order details and complete your purchase securely.
          </div>
        </div>
        <Link 
          to="/cart" 
          className="btn btn-secondary"
          style={{
            fontSize: "13px",
            padding: "8px 14px",
            whiteSpace: "nowrap"
          }}
        >
          ← Back to Cart
        </Link>
      </div>
      <form className="grid" onSubmit={placeOrder}>
        <div className="card grid">
          <h3 style={{ margin: "0 0 6px" }}>Addresses</h3>

          {/* Shipping */}
          <div className="field">
            <div className="meta">Shipping Address</div>
            {addresses.filter((a) => a.type === "shipping").length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <select className="select" value={shippingId} onChange={(e) => setShippingId(e.target.value)}>
                  <option value="">Select shipping address</option>
                  {addresses.filter((a) => a.type === "shipping").map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.line1}, {a.city} {a.state} {a.postalCode} {a.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary btn-slim" onClick={() => openQuickAdd("shipping")}>
                  New
                </button>
              </div>
            ) : (
              <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <label className="field">
                    <div className="meta" style={{ fontSize: 12 }}>Line 1 *</div>
                    <input 
                      className="input" 
                      value={addrDraft.line1} 
                      onChange={(e) => setAddrDraft((d) => ({ ...d, line1: e.target.value, type: "shipping" }))}
                      placeholder="123 Main St"
                    />
                  </label>
                  <label className="field">
                    <div className="meta" style={{ fontSize: 12 }}>Line 2</div>
                    <input 
                      className="input" 
                      value={addrDraft.line2} 
                      onChange={(e) => setAddrDraft((d) => ({ ...d, line2: e.target.value, type: "shipping" }))}
                      placeholder="Apt 4B"
                    />
                  </label>
                  <label className="field">
                    <div className="meta" style={{ fontSize: 12 }}>City *</div>
                    <input 
                      className="input" 
                      value={addrDraft.city} 
                      onChange={(e) => setAddrDraft((d) => ({ ...d, city: e.target.value, type: "shipping" }))}
                      placeholder="New York"
                    />
                  </label>
                  <label className="field">
                    <div className="meta" style={{ fontSize: 12 }}>State *</div>
                    <input 
                      className="input" 
                      value={addrDraft.state} 
                      onChange={(e) => setAddrDraft((d) => ({ ...d, state: e.target.value, type: "shipping" }))}
                      placeholder="NY"
                    />
                  </label>
                  <label className="field">
                    <div className="meta" style={{ fontSize: 12 }}>Postal Code *</div>
                    <input 
                      className="input" 
                      value={addrDraft.postalCode} 
                      onChange={(e) => setAddrDraft((d) => ({ ...d, postalCode: e.target.value, type: "shipping" }))}
                      placeholder="10001"
                    />
                  </label>
                  <label className="field">
                    <div className="meta" style={{ fontSize: 12 }}>Country *</div>
                    <input 
                      className="input" 
                      value={addrDraft.country} 
                      onChange={(e) => setAddrDraft((d) => ({ ...d, country: e.target.value, type: "shipping" }))}
                      placeholder="US"
                    />
                  </label>
                </div>
                {user?.uid && (
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-slim"
                      onClick={async () => {
                        try {
                          const created = await createAddress(user.uid, { ...addrDraft, type: "shipping" });
                          const rows = await getAddresses(user.uid);
                          setAddresses(rows);
                          setShippingId(created.id);
                          setAddrDraft({
                            type: "shipping",
                            line1: "",
                            line2: "",
                            city: "",
                            state: "",
                            postalCode: "",
                            country: "US",
                            isDefault: false,
                          });
                        } catch (e) {
                          alert(e.message || String(e));
                        }
                      }}
                      style={{ fontSize: 12 }}
                    >
                      Save Address
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Same as Shipping Checkbox */}
          <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
            <input
              type="checkbox"
              checked={sameAsShipping}
              onChange={(e) => {
                setSameAsShipping(e.target.checked);
                if (e.target.checked && shippingId) {
                  setBillingId(shippingId);
                }
              }}
            />
            <span style={{ fontWeight: 600 }}>Same as Shipping Address</span>
          </label>

          {/* Billing */}
          {!sameAsShipping && (
            <div className="field">
              <div className="meta">Billing Address</div>
              {addresses.filter((a) => a.type === "billing").length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                  <select className="select" value={billingId} onChange={(e) => setBillingId(e.target.value)}>
                    <option value="">Select billing address</option>
                    {addresses.filter((a) => a.type === "billing").map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.line1}, {a.city} {a.state} {a.postalCode} {a.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary btn-slim" onClick={() => openQuickAdd("billing")}>
                    New
                  </button>
                </div>
              ) : (
                <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                  <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <label className="field">
                      <div className="meta" style={{ fontSize: 12 }}>Line 1 *</div>
                      <input 
                        className="input" 
                        value={addrDraft.line1} 
                        onChange={(e) => setAddrDraft((d) => ({ ...d, line1: e.target.value, type: "billing" }))}
                        placeholder="123 Main St"
                      />
                    </label>
                    <label className="field">
                      <div className="meta" style={{ fontSize: 12 }}>Line 2</div>
                      <input 
                        className="input" 
                        value={addrDraft.line2} 
                        onChange={(e) => setAddrDraft((d) => ({ ...d, line2: e.target.value, type: "billing" }))}
                        placeholder="Apt 4B"
                      />
                    </label>
                    <label className="field">
                      <div className="meta" style={{ fontSize: 12 }}>City *</div>
                      <input 
                        className="input" 
                        value={addrDraft.city} 
                        onChange={(e) => setAddrDraft((d) => ({ ...d, city: e.target.value, type: "billing" }))}
                        placeholder="New York"
                      />
                    </label>
                    <label className="field">
                      <div className="meta" style={{ fontSize: 12 }}>State *</div>
                      <input 
                        className="input" 
                        value={addrDraft.state} 
                        onChange={(e) => setAddrDraft((d) => ({ ...d, state: e.target.value, type: "billing" }))}
                        placeholder="NY"
                      />
                    </label>
                    <label className="field">
                      <div className="meta" style={{ fontSize: 12 }}>Postal Code *</div>
                      <input 
                        className="input" 
                        value={addrDraft.postalCode} 
                        onChange={(e) => setAddrDraft((d) => ({ ...d, postalCode: e.target.value, type: "billing" }))}
                        placeholder="10001"
                      />
                    </label>
                    <label className="field">
                      <div className="meta" style={{ fontSize: 12 }}>Country *</div>
                      <input 
                        className="input" 
                        value={addrDraft.country} 
                        onChange={(e) => setAddrDraft((d) => ({ ...d, country: e.target.value, type: "billing" }))}
                        placeholder="US"
                      />
                    </label>
                  </div>
                  {user?.uid && (
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-slim"
                        onClick={async () => {
                          try {
                            const created = await createAddress(user.uid, { ...addrDraft, type: "billing" });
                            const rows = await getAddresses(user.uid);
                            setAddresses(rows);
                            setBillingId(created.id);
                            setAddrDraft({
                              type: "billing",
                              line1: "",
                              line2: "",
                              city: "",
                              state: "",
                              postalCode: "",
                              country: "US",
                              isDefault: false,
                            });
                          } catch (e) {
                            alert(e.message || String(e));
                          }
                        }}
                        style={{ fontSize: 12 }}
                      >
                        Save Address
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="card grid">
          <div className="hero-title-row" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Payment Method</h3>
            {storePaymentTypes.length > 0 && (
              <button 
                type="button" 
                className="btn btn-secondary btn-slim"
                onClick={() => setShowAddPaymentModal(true)}
              >
                + Add New
              </button>
            )}
          </div>

          {storePaymentTypes.length === 0 ? (
            <div style={{ padding: 12, background: "#fff7e6", borderRadius: 8 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                No payment methods available. Please contact support.
              </p>
            </div>
          ) : availableUserMethods.length === 0 ? (
            <div style={{ padding: 12, background: "#eaf4ff", borderRadius: 8 }}>
              <p style={{ margin: 0 }}>
                No saved payment methods. Click "Add New" to add one.
              </p>
            </div>
          ) : (
            availableUserMethods.map((method) => (
              <div 
                key={method.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: 8,
                  border: selectedPaymentMethod === method.id ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: 8,
                  opacity: method.disabled ? 0.5 : 1,
                  cursor: method.disabled ? "not-allowed" : "pointer",
                  background: selectedPaymentMethod === method.id ? "#fff4e6" : "transparent",
                }}
                onClick={() => !method.disabled && setSelectedPaymentMethod(method.id)}
              >
                <input 
                  type="radio" 
                  name="pay" 
                  value={method.id}
                  checked={selectedPaymentMethod === method.id}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  disabled={method.disabled}
                  style={{ cursor: method.disabled ? "not-allowed" : "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    {method.label}
                    {method.last4 && <span className="meta" style={{ marginLeft: 8 }}>****{method.last4}</span>}
                  </div>
                  <div className="meta" style={{ fontSize: 11 }}>
                    {method.type === "card" ? "Credit/Debit Card" : "Cash on Delivery"}
                    {method.disabled && " • No longer available in store"}
                  </div>
                </div>
                {method.isDefault ? (
                  <span className="pill" style={{ background: "#eaf8f0", color: "#065f46", fontSize: 11 }}>
                    Default
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-slim"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(method.id);
                    }}
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    Set Default
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </form>

      <section className="grid">
        <div className="card grid">
          <h3 style={{ margin: "0 0 6px" }}>Your Order</h3>
          {items.map((i) => (
            <div key={i.id} className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Link to={`/product/${i.id}`} style={{ position: 'relative', display: 'block' }}>
                <img
                  src={i.image || FALLBACK}
                  alt={i.title}
                  width={80}
                  height={80}
                  style={{ objectFit: "contain", background: "#fff", border: "1px solid #eee", borderRadius: 8, cursor: "pointer" }}
                  onError={(e) => { e.currentTarget.src = FALLBACK; }}
                />
                {/* Quantity Badge */}
                <div style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: 'var(--primary)',
                  color: '#111',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {i.quantity}
                </div>
              </Link>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{i.title}</div>
                <div className="meta">Qty: {i.quantity}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{formatPrice(i.price * i.quantity)}</div>
            </div>
          ))}

          {/* Saved discount codes - show both applied and pending */}
          {getSavedDiscountCodes().length > 0 && (
            <div style={{ display: "grid", gap: 8, marginBottom: 8 }}>
              <div className="meta" style={{ fontWeight: 600, marginBottom: 4 }}>
                Saved Discount Codes:
              </div>
              {getSavedDiscountCodes().map((code) => {
                const disc = appliedDiscounts.find(d => d.code === code);
                const error = discountResult.errors.find(e => e.code === code);
                const appliedDisc = discountResult.appliedDiscounts.find(d => d.code === code);
                const amount = appliedDisc ? appliedDisc.appliedAmount : 0;
                const isApplied = !!disc;
                
                return (
                  <div 
                    key={code}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: isApplied ? "#eaf8f0" : "#fff7e6",
                      borderRadius: 6,
                      fontSize: 14,
                      border: isApplied ? "1px solid #10b981" : "1px solid #f59e0b"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: isApplied ? "#065f46" : "#92400e" }}>
                        {code} {isApplied && "✓"}
                      </div>
                      <div className="meta" style={{ fontSize: 12 }}>
                        {disc?.description || error?.code}
                        {isApplied && amount > 0 && ` • Saving: $${amount.toFixed(2)}`}
                      </div>
                      {error && (
                        <div className="meta" style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>
                          ⚠️ {error.reason}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDiscount(code)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        padding: "4px 8px",
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Coupon row */}
          <form
            className="grid coupon-row"
            style={{ gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}
            onSubmit={(e) => { e.preventDefault(); applyCoupon(); }}
          >
            {toast.open && (
              <div className={`toast coupon ${toast.kind}`} role="status" aria-live="polite">
                {toast.msg}
              </div>
            )}
            <input
              id="coupon-input"
              className="input"
              placeholder="Add Coupon Code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button className="btn btn-secondary" type="submit">Apply</button>
          </form>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span><strong>{formatPrice(subtotal)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Delivery</span><strong>{formatPrice(shippingCost)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Discount</span><strong>-{formatPrice(discountAmount)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
              <span>Total</span><strong>{formatPrice(total)}</strong>
            </div>
          </div>

          {/* Place Order Button - moved here */}
          <button 
            className="btn btn-primary" 
            type="submit" 
            onClick={placeOrder}
            style={{ 
              fontSize: 18, 
              padding: "16px 32px",
              width: "100%",
              fontWeight: 700,
              borderRadius: 12
            }}
          >
            Place Order
          </button>
        </div>
      </section>

      {/* Add payment method modal */}
      {showAddPaymentModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 480, width: "100%" }}>
            <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Add Payment Method</h3>
              <button className="btn btn-secondary btn-slim" onClick={() => setShowAddPaymentModal(false)}>Close</button>
            </div>

            <div className="grid" style={{ gap: 12 }}>
              <label className="field">
                <div className="meta" style={{ fontWeight: 600 }}>Payment Type *</div>
                <select
                  className="select"
                  value={newPaymentDraft.type}
                  onChange={(e) => setNewPaymentDraft(d => ({ ...d, type: e.target.value }))}
                >
                  {storePaymentTypes.map(type => (
                    <option key={type} value={type}>{paymentLabels[type] || type}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <div className="meta" style={{ fontWeight: 600 }}>Label (e.g., "Personal Visa") *</div>
                <input
                  className="input"
                  placeholder="My Credit Card"
                  value={newPaymentDraft.label}
                  onChange={(e) => setNewPaymentDraft(d => ({ ...d, label: e.target.value }))}
                />
              </label>

              {newPaymentDraft.type === "card" && (
                <label className="field">
                  <div className="meta" style={{ fontWeight: 600 }}>Last 4 Digits *</div>
                  <input
                    className="input"
                    placeholder="1234"
                    maxLength="4"
                    value={newPaymentDraft.last4}
                    onChange={(e) => setNewPaymentDraft(d => ({ ...d, last4: e.target.value.replace(/\D/g, '') }))}
                  />
                </label>
              )}

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={newPaymentDraft.isDefault}
                  onChange={(e) => setNewPaymentDraft(d => ({ ...d, isDefault: e.target.checked }))}
                />
                <span>Set as default payment method</span>
              </label>
            </div>

            <div className="actions" style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddPaymentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddPaymentMethod}>Add Payment Method</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick add address modal */}
      {addrOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 560, width: "100%" }}>
            <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>New {addrType === "billing" ? "Billing" : "Shipping"} Address</h3>
              <button className="btn btn-secondary btn-slim" onClick={() => setAddrOpen(false)}>Close</button>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label className="field">
                <div className="meta">Line 1</div>
                <input className="input" value={addrDraft.line1} onChange={(e) => setAddrDraft((d) => ({ ...d, line1: e.target.value }))} />
              </label>
              <label className="field">
                <div className="meta">Line 2</div>
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
              <button className="btn btn-secondary" onClick={() => setAddrOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveQuickAdd}>Create Address</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
