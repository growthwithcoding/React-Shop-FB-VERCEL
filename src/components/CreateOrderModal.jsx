// src/components/CreateOrderModal.jsx
import { useState, useEffect } from "react";
import { getUsers } from "../services/userService";
import { listProducts } from "../services/productService";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CreateOrderModal({ open, onClose, onSave }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  
  // Data sources
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("unfulfilled");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [notes, setNotes] = useState("");

  // Item selection
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open) return;
    
    async function loadData() {
      try {
        const [usersData, productsData] = await Promise.all([
          getUsers(),
          listProducts(),
        ]);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    }
    
    loadData();
    
    // Reset form
    setSelectedUserId("");
    setOrderItems([]);
    setPaymentStatus("pending");
    setFulfillmentStatus("unfulfilled");
    setShippingMethod("standard");
    setNotes("");
    setSelectedProductId("");
    setQuantity(1);
    setErr("");
  }, [open]);

  if (!open) return null;

  const handleAddItem = () => {
    if (!selectedProductId) {
      setErr("Please select a product");
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      setErr("Product not found");
      return;
    }

    // Check if item already exists
    const existingIndex = orderItems.findIndex(item => item.productId === selectedProductId);
    
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...orderItems];
      updated[existingIndex].quantity += quantity;
      setOrderItems(updated);
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          title: product.title,
          price: product.price || 0,
          quantity: quantity,
          image: product.image,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity(1);
    setErr("");
  };

  const handleRemoveItem = (productId) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setOrderItems(
      orderItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = shippingMethod === "express" ? 15 : shippingMethod === "overnight" ? 30 : 5;
    return subtotal + shipping;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setErr("Please select a customer");
      return;
    }
    
    if (orderItems.length === 0) {
      setErr("Please add at least one item to the order");
      return;
    }

    try {
      setBusy(true);
      setErr("");
      
      const orderData = {
        userId: selectedUserId,
        items: orderItems,
        paymentStatus,
        fulfillmentStatus,
        shippingMethod,
        notes,
        total: calculateTotal(),
        subtotal: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        shipping: shippingMethod === "express" ? 15 : shippingMethod === "overnight" ? 30 : 5,
      };

      await onSave(orderData);
      onClose();
    } catch (error) {
      setErr(error?.message || "Failed to create order");
    } finally {
      setBusy(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 800, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Create New Order</h3>
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
          <div style={{ display: "grid", gap: 16 }}>
            {/* Customer Selection */}
            <div className="field">
              <div className="meta" style={{ marginBottom: 6 }}>Customer *</div>
              <select
                className="select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                style={{ padding: "6px 10px", fontSize: "13px" }}
              >
                <option value="">Select a customer...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
              {selectedUser && (
                <div style={{ marginTop: 8, padding: 8, background: "#f9fafb", borderRadius: 6, fontSize: 13 }}>
                  <strong>Selected:</strong> {selectedUser.firstName} {selectedUser.lastName} - {selectedUser.email}
                </div>
              )}
            </div>

            {/* Add Items Section */}
            <div style={{ padding: 16, background: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb" }}>
              <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Add Items to Order</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "end" }}>
                <div className="field">
                  <div className="meta" style={{ marginBottom: 6 }}>Product</div>
                  <select
                    className="select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                  >
                    <option value="">Select a product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title} - {USD.format(product.price || 0)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <div className="meta" style={{ marginBottom: 6 }}>Qty</div>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    style={{ width: 80, padding: "6px 8px", fontSize: "13px" }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddItem}
                  style={{ height: 44 }}
                >
                  Add Item
                </button>
              </div>

              {/* Order Items List */}
              {orderItems.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Order Items</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {orderItems.map((item) => (
                      <div
                        key={item.productId}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "48px 1fr auto auto auto",
                          gap: 12,
                          alignItems: "center",
                          padding: 12,
                          background: "#fff",
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <img
                          src={item.image || "https://via.placeholder.com/48"}
                          alt={item.title}
                          style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 4 }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {USD.format(item.price)} each
                          </div>
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                          style={{
                            width: 60,
                            padding: "4px 8px",
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            textAlign: "center",
                          }}
                        />
                        <div style={{ fontWeight: 700, minWidth: 80, textAlign: "right" }}>
                          {USD.format(item.price * item.quantity)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          style={{
                            padding: "4px 8px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: 4,
                            color: "#991b1b",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div style={{ marginTop: 12, padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Subtotal:</span>
                      <span>{USD.format(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Shipping:</span>
                      <span>{USD.format(shippingMethod === "express" ? 15 : shippingMethod === "overnight" ? 30 : 5)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                      <span>Total:</span>
                      <span>{USD.format(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div className="field">
                <div className="meta" style={{ marginBottom: 6 }}>Payment Status</div>
                <select
                  className="select"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="field">
                <div className="meta" style={{ marginBottom: 6 }}>Fulfillment Status</div>
                <select
                  className="select"
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                >
                  <option value="unfulfilled">Unfulfilled</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div className="field">
                <div className="meta" style={{ marginBottom: 6 }}>Shipping Method</div>
                <select
                  className="select"
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: "13px" }}
                >
                  <option value="standard">Standard ($5)</option>
                  <option value="express">Express ($15)</option>
                  <option value="overnight">Overnight ($30)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="field">
              <div className="meta" style={{ marginBottom: 6 }}>Order Notes (Optional)</div>
              <textarea
                className="input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions or notes..."
                style={{ padding: "6px 10px", fontSize: "13px" }}
              />
            </div>

            {err && (
              <div
                style={{
                  padding: 12,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  color: "#991b1b",
                  fontSize: 14,
                }}
              >
                {err}
              </div>
            )}
          </div>

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
              disabled={busy || orderItems.length === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 600,
                background: busy || orderItems.length === 0 ? "#9ca3af" : "#067D62",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: busy || orderItems.length === 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: busy || orderItems.length === 0 ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!busy && orderItems.length > 0) {
                  e.currentTarget.style.background = "#055A4A";
                }
              }}
              onMouseLeave={(e) => {
                if (!busy && orderItems.length > 0) {
                  e.currentTarget.style.background = "#067D62";
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              {busy ? "Creating Order..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
