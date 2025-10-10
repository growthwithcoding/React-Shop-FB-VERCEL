import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getOrderById } from "../services/orderService";
import { formatPrice } from "../utils/money";

/**
 * Order Confirmation page displayed after successful order placement
 */
export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !user?.uid) {
      navigate("/");
      return;
    }

    let alive = true;
    async function loadOrder() {
      try {
        const orderData = await getOrderById(orderId);
        if (!alive) return;
        
        if (!orderData) {
          navigate("/orders");
          return;
        }
        
        setOrder(orderData);
      } catch (err) {
        console.error("Failed to load order:", err);
        navigate("/orders");
      } finally {
        if (alive) setLoading(false);
      }
    }
    
    loadOrder();
    return () => { alive = false; };
  }, [orderId, user?.uid, navigate]);

  if (loading) {
    return (
      <main className="container" style={{ padding: 24, textAlign: "center" }}>
        <div className="loading-spinner" style={{ margin: "60px auto" }}>
          Loading order details...
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <main className="container" style={{ padding: 24 }}>
      <div className="card" style={{ maxWidth: 800, margin: "0 auto", padding: 32, textAlign: "center" }}>
        {/* Success Icon */}
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        
        <h1 style={{ marginTop: 0, marginBottom: 8, color: "var(--success)" }}>
          Order Confirmed!
        </h1>
        
        <p style={{ fontSize: 18, marginBottom: 24, color: "var(--text-secondary)" }}>
          Thank you for your purchase. Your order has been successfully placed.
        </p>

        {/* Order Details Card */}
        <div className="card" style={{ textAlign: "left", padding: 20, marginBottom: 24, background: "var(--bg-secondary)" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontWeight: 600 }}>Order Number:</span>
              <span style={{ fontFamily: "monospace" }}>{order.id}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Order Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Status:</span>
              <span style={{ 
                padding: "4px 12px", 
                borderRadius: 12, 
                background: "var(--warning-bg)", 
                color: "var(--warning)",
                fontSize: 14,
                fontWeight: 600
              }}>
                {order.status || "Pending"}
              </span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <span style={{ fontWeight: 600 }}>Items:</span>
              <span>{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Subtotal:</span>
              <span>{formatPrice(order.subtotal || 0)}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Delivery:</span>
              <span>{formatPrice(order.delivery || 0)}</span>
            </div>
            
            {order.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>Discount:</span>
                <span style={{ color: "var(--success)" }}>-{formatPrice(order.discount)}</span>
              </div>
            )}
            
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              paddingTop: 12, 
              borderTop: "2px solid var(--border)",
              fontSize: 20,
              fontWeight: 700
            }}>
              <span>Total:</span>
              <span>{formatPrice(order.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        <div style={{ 
          padding: 16, 
          background: "var(--info-bg)", 
          border: "1px solid var(--info)",
          borderRadius: 8,
          marginBottom: 24,
          textAlign: "left"
        }}>
          <p style={{ margin: 0, color: "var(--text)" }}>
            📧 A confirmation email has been sent to <strong>{user?.email}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to={`/orders/${order.id}`} className="btn btn-primary">
            View Order Details
          </Link>
          <Link to="/orders" className="btn btn-secondary">
            View All Orders
          </Link>
          <Link to="/" className="btn btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
