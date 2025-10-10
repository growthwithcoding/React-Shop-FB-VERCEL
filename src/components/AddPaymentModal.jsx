// src/components/AddPaymentModal.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { createPaymentMethod } from "../services/paymentService";
import { getSettings } from "../services/settingsService";

export default function AddPaymentModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState("select"); // "select", "card", "paypal", "apple_pay", "google_pay"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedMethods, setAcceptedMethods] = useState(["card", "paypal", "apple_pay", "google_pay"]);
  
  // Card form state
  const [cardForm, setCardForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    isDefault: false,
  });

  // PayPal form state
  const [paypalForm, setPaypalForm] = useState({
    paypalEmail: "",
    isDefault: false,
  });

  // Load accepted payment methods from settings
  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const settings = await getSettings();
          setAcceptedMethods(settings.payments?.acceptedMethods || ["card", "paypal", "apple_pay", "google_pay"]);
        } catch (e) {
          console.error("Failed to load payment settings:", e);
        }
      })();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep("select");
      setError("");
      setCardForm({ cardholderName: "", cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "", isDefault: false });
      setPaypalForm({ paypalEmail: "", isDefault: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectMethod = (type) => {
    setError("");
    setStep(type);
  };

  const handleBack = () => {
    setError("");
    setStep("select");
  };

  const detectCardBrand = (number) => {
    const cleaned = number.replace(/\s/g, "");
    if (/^4/.test(cleaned)) return "visa";
    if (/^5[1-5]/.test(cleaned)) return "mastercard";
    if (/^3[47]/.test(cleaned)) return "amex";
    return "";
  };

  const handleSubmitCard = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      setError("You must be logged in to add a payment method");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cardBrand = detectCardBrand(cardForm.cardNumber);
      await createPaymentMethod(user.uid, {
        type: "card",
        cardholderName: cardForm.cardholderName,
        cardNumber: cardForm.cardNumber.replace(/\s/g, ""),
        expiryMonth: cardForm.expiryMonth,
        expiryYear: cardForm.expiryYear,
        cardBrand,
        isDefault: cardForm.isDefault,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add payment method");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayPal = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      setError("You must be logged in to add a payment method");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createPaymentMethod(user.uid, {
        type: "paypal",
        paypalEmail: paypalForm.paypalEmail,
        isDefault: paypalForm.isDefault,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add PayPal account");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDigitalWallet = async (type) => {
    if (!user?.uid) {
      setError("You must be logged in to add a payment method");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createPaymentMethod(user.uid, {
        type,
        deviceId: `${type}_${Date.now()}`,
        isDefault: false,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add payment method");
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, "");
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(" ") : cleaned;
  };

  const paymentOptions = [
    { type: "card", icon: "💳", label: "Credit/Debit Card", subtitle: "Visa, Mastercard, Amex" },
    { type: "paypal", icon: "🔵", label: "PayPal", subtitle: "Link your PayPal account" },
    { type: "apple_pay", icon: "🍎", label: "Apple Pay", subtitle: "Pay with Apple devices" },
    { type: "google_pay", icon: "🤖", label: "Google Pay", subtitle: "Pay with Google" },
  ].filter(option => acceptedMethods.includes(option.type));

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>
            {step === "select" ? "Add Payment Method" : 
             step === "card" ? "Add Credit/Debit Card" :
             step === "paypal" ? "Add PayPal Account" :
             step === "apple_pay" ? "Add Apple Pay" :
             "Add Google Pay"}
          </h3>
          <button className="btn btn-secondary btn-slim" onClick={onClose} type="button">
            Close
          </button>
        </div>

        {error && (
          <div className="card" style={{ padding: 12, color: "var(--danger, #991b1b)", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Select Payment Method */}
        {step === "select" && (
          <div>
            <p className="meta" style={{ marginBottom: 16 }}>
              Choose a payment method to add to your account:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {paymentOptions.map(option => (
                <button
                  key={option.type}
                  className="card"
                  style={{
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    border: "1px solid var(--border)",
                    background: "var(--card-bg)",
                    textAlign: "left",
                  }}
                  onClick={() => handleSelectMethod(option.type)}
                  type="button"
                >
                  <div style={{ fontSize: 32 }}>{option.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{option.label}</div>
                    <div className="meta">{option.subtitle}</div>
                  </div>
                  <div style={{ fontSize: 20, color: "var(--text-secondary)" }}>→</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card Form */}
        {step === "card" && (
          <form onSubmit={handleSubmitCard}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="field">
                <div className="meta">Cardholder Name</div>
                <input
                  className="input"
                  type="text"
                  placeholder="John Doe"
                  value={cardForm.cardholderName}
                  onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                  required
                />
              </label>
              
              <label className="field">
                <div className="meta">Card Number</div>
                <input
                  className="input"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={formatCardNumber(cardForm.cardNumber)}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\s/g, "");
                    if (/^\d*$/.test(cleaned) && cleaned.length <= 16) {
                      setCardForm({ ...cardForm, cardNumber: cleaned });
                    }
                  }}
                  maxLength="19"
                  required
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <label className="field">
                  <div className="meta">Month</div>
                  <input
                    className="input"
                    type="text"
                    placeholder="MM"
                    value={cardForm.expiryMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val) && val.length <= 2) {
                        setCardForm({ ...cardForm, expiryMonth: val });
                      }
                    }}
                    maxLength="2"
                    required
                  />
                </label>
                
                <label className="field">
                  <div className="meta">Year</div>
                  <input
                    className="input"
                    type="text"
                    placeholder="YY"
                    value={cardForm.expiryYear}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val) && val.length <= 2) {
                        setCardForm({ ...cardForm, expiryYear: val });
                      }
                    }}
                    maxLength="2"
                    required
                  />
                </label>

                <label className="field">
                  <div className="meta">CVV</div>
                  <input
                    className="input"
                    type="text"
                    placeholder="123"
                    value={cardForm.cvv}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val) && val.length <= 4) {
                        setCardForm({ ...cardForm, cvv: val });
                      }
                    }}
                    maxLength="4"
                    required
                  />
                </label>
              </div>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={cardForm.isDefault}
                  onChange={(e) => setCardForm({ ...cardForm, isDefault: e.target.checked })}
                />
                Set as default payment method
              </label>
            </div>

            <div className="actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={handleBack} type="button" disabled={loading}>
                Back
              </button>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Card"}
              </button>
            </div>
          </form>
        )}

        {/* PayPal Form */}
        {step === "paypal" && (
          <form onSubmit={handleSubmitPayPal}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="field">
                <div className="meta">PayPal Email</div>
                <input
                  className="input"
                  type="email"
                  placeholder="your-email@example.com"
                  value={paypalForm.paypalEmail}
                  onChange={(e) => setPaypalForm({ ...paypalForm, paypalEmail: e.target.value })}
                  required
                />
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={paypalForm.isDefault}
                  onChange={(e) => setPaypalForm({ ...paypalForm, isDefault: e.target.checked })}
                />
                Set as default payment method
              </label>

              <div className="card" style={{ padding: 12, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                <div className="meta" style={{ fontSize: 12 }}>
                  ℹ️ You'll be redirected to PayPal to authorize this connection during checkout.
                </div>
              </div>
            </div>

            <div className="actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={handleBack} type="button" disabled={loading}>
                Back
              </button>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add PayPal"}
              </button>
            </div>
          </form>
        )}

        {/* Apple Pay */}
        {step === "apple_pay" && (
          <div>
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🍎</div>
              <h4 style={{ marginBottom: 12 }}>Apple Pay</h4>
              <p className="meta" style={{ marginBottom: 16, lineHeight: 1.6 }}>
                Apple Pay will be available during checkout on compatible devices.
                Make sure you have Apple Pay set up on your device.
              </p>
            </div>

            <div className="actions">
              <button className="btn btn-secondary" onClick={handleBack} type="button" disabled={loading}>
                Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleSubmitDigitalWallet("apple_pay")}
                type="button"
                disabled={loading}
              >
                {loading ? "Adding..." : "Enable Apple Pay"}
              </button>
            </div>
          </div>
        )}

        {/* Google Pay */}
        {step === "google_pay" && (
          <div>
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
              <h4 style={{ marginBottom: 12 }}>Google Pay</h4>
              <p className="meta" style={{ marginBottom: 16, lineHeight: 1.6 }}>
                Google Pay will be available during checkout on compatible devices.
                Make sure you have Google Pay set up in your Google account.
              </p>
            </div>

            <div className="actions">
              <button className="btn btn-secondary" onClick={handleBack} type="button" disabled={loading}>
                Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleSubmitDigitalWallet("google_pay")}
                type="button"
                disabled={loading}
              >
                {loading ? "Adding..." : "Enable Google Pay"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
