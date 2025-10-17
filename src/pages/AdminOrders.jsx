// src/pages/AdminOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { listOrders, createOrderFromAdmin, updateOrder, deleteOrder } from "../services/orderService";
import { useDashboard } from "../hooks/useDashboard";
import { Pagination } from "../components/Pagination";
import { FilteredResultsFeedback } from "../components/dashboard/FilteredResultsFeedback";
import CreateOrderModal from '../components/CreateOrderModal';

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function AdminOrders() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters } = useDashboard();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  
  // Edit modal state
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({ paymentStatus: "", fulfillmentStatus: "" });
  
  // Create order modal state
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);

  // Load orders from Firestore
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listOrders({ take: 500 });
        if (alive) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Apply all filters including global dashboard filters
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // Local status filters (more specific than global)
      if (status === "paid" && o.paymentStatus !== "paid") return false;
      if (status === "unpaid" && o.paymentStatus !== "unpaid") return false;
      if (status === "refunded" && o.paymentStatus !== "refunded") return false;
      if (status === "fulfilled" && o.fulfillmentStatus !== "fulfilled") return false;
      if (status === "unfulfilled" && o.fulfillmentStatus !== "unfulfilled") return false;
      if (status === "flagged" && !o.flagged) return false;

      // Local date filters (take precedence if set, otherwise use global)
      const orderDate = o.createdAt?.toDate?.()?.toISOString().split('T')[0] || 
                        new Date(o.createdAt?.seconds * 1000).toISOString().split('T')[0];
      if (from && orderDate < from) return false;
      if (to && orderDate > to) return false;
      
      // Price filters (local only)
      if (min && o.total < Number(min)) return false;
      if (max && o.total > Number(max)) return false;

      // Local search filter (combined with global)
      if (q) {
        const s = q.toLowerCase();
        const searchString = `${o.id} ${o.userId} ${o.shippingAddressSnapshot?.fullName || ''} ${o.billingAddressSnapshot?.fullName || ''}`.toLowerCase();
        if (!searchString.includes(s)) return false;
      }

      // Global dashboard filters
      if (filters.category && filters.category !== 'all') {
        const hasCategory = o.items?.some(item => item.category === filters.category);
        if (!hasCategory) return false;
      }

      if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') {
        // Only apply global fulfillment filter if no local status filter is set
        if (status === 'all' && o.fulfillmentStatus !== filters.fulfillmentStatus) return false;
      }
      
      if (filters.channel && filters.channel !== 'all' && o.channel) {
        if (o.channel !== filters.channel) return false;
      }
      
      if (filters.region && filters.region !== 'all' && o.region) {
        if (o.region !== filters.region) return false;
      }

      return true;
    });
  }, [orders, status, from, to, min, max, q, filters]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  }, [filtered, page, perPage]);

  const totalPages = Math.ceil(filtered.length / perPage);

  // Calculate attention metrics for inline stats
  const attentionMetrics = useMemo(() => {
    const unpaid = filtered.filter(o => 
      o.paymentStatus === "unpaid" || o.paymentStatus === "pending" || o.status === "unpaid"
    ).length;
    
    const unfulfilled = filtered.filter(o => {
      const paymentStatus = o.paymentStatus || o.status || "pending";
      const fulfillmentStatus = o.fulfillmentStatus || o.fulfillment || "unfulfilled";
      return (paymentStatus === "paid" || paymentStatus === "completed") && 
        fulfillmentStatus === "unfulfilled";
    }).length;
    
    const flagged = filtered.filter(o => o.flagged === true).length;
    
    return { unpaid, unfulfilled, flagged };
  }, [filtered]);

  const isAdmin = !!user && user.role === "admin";
  
  // Handle order update
  const handleUpdateOrder = async (orderId) => {
    try {
      await updateOrder(orderId, {
        paymentStatus: editForm.paymentStatus,
        fulfillmentStatus: editForm.fulfillmentStatus,
      });
      // Refresh orders
      const data = await listOrders({ take: 500 });
      setOrders(Array.isArray(data) ? data : []);
      setEditingOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order");
    }
  };
  
  // Handle order deletion
  const handleDeleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    try {
      await deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order");
    }
  };
  
  // Open edit modal
  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditForm({
      paymentStatus: order.paymentStatus || order.status || "pending",
      fulfillmentStatus: order.fulfillmentStatus || "unfulfilled",
    });
  };

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "—";
    try {
      const d = date.toDate ? date.toDate() : new Date(date.seconds * 1000);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return "—";
    }
  };

  // Get customer name helper
  const getCustomerName = (order) => {
    return order.shippingAddressSnapshot?.fullName || 
           order.billingAddressSnapshot?.fullName || 
           order.userId || 
           "Unknown";
  };

  // Amazon color palette
  const amazonColors = {
    orange: "#FF9900",
    darkOrange: "#FF6600",
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

  return !isAdmin ? (
    <div className="container" style={{ padding: 24 }}>Access denied.</div>
  ) : (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
      <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Hero Headline with Title, Description, and Actions */}
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker">Admin</div>
            <h1 style={{ margin: 0 }}>Orders</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Manage and track all customer orders
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
              onClick={() => setShowCreateOrderModal(true)}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Order
            </button>
          </div>
        </div>
        {/* Filtered Results Feedback */}
        <FilteredResultsFeedback 
          resultCount={filtered.length} 
          totalCount={orders.length} 
          entityName="orders" 
        />

        <div className="card" style={{
          padding: 20, 
          background: "#fff",
          borderRadius: "12px",
          ...cardShadow
        }}>
          {/* Single Row: Title - Filters - Stats */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, marginBottom: 16 }}>
            {/* Title */}
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: amazonColors.darkBg, minWidth: "120px" }}>Orders List</h2>
            
            {/* Filters - Centered */}
            <div
              className="grid"
              style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr 0.8fr", gap: 6, flex: 1, maxWidth: "900px" }}
            >
              <input
                className="input"
                placeholder="Search ID, customer…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ fontSize: "13px", padding: "6px 10px" }}
              />
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ fontSize: "13px", padding: "6px 10px" }}
              >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="unfulfilled">Unfulfilled</option>
                <option value="flagged">Flagged</option>
                <option value="refunded">Refunded</option>
              </select>
              <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ fontSize: "13px", padding: "6px 10px" }} />
              <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ fontSize: "13px", padding: "6px 10px" }} />
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Min $"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                style={{ fontSize: "13px", padding: "6px 10px" }}
              />
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Max $"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                style={{ fontSize: "13px", padding: "6px 10px" }}
              />
            </div>
            
            {/* Order Status Mini Stats */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: "280px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>UNPAID</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#F9C74F" }}>{attentionMetrics.unpaid}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>UNFULFILLED</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#146EB4" }}>{attentionMetrics.unfulfilled}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>FLAGGED</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#E53E3E" }}>{attentionMetrics.flagged}</div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div style={{ padding: 20, paddingTop: 0, textAlign: 'center' }}>Loading orders...</div>
          ) : (
            <>
              <div style={{ overflowX: "auto", borderRadius: 12 }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <Th>ID</Th>
                  <Th>Date</Th>
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th align="right">Total</Th>
                  <Th align="center">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o, index) => (
                  <tr key={o.id} style={{ 
                    borderBottom: "1px solid var(--border)",
                    background: index % 2 === 0 ? "#fff" : "#f9fafb"
                  }}>
                    <Td>{o.id.slice(0, 8)}...</Td>
                    <Td>{formatDate(o.createdAt)}</Td>
                    <Td>
                      <div style={{ fontWeight: 700 }}>{getCustomerName(o)}</div>
                      <div className="meta" style={{ whiteSpace: "nowrap" }}>{o.userId?.slice(0, 12)}...</div>
                    </Td>
                    <Td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span
                          className="pill"
                          style={badgeTone(
                            o.paymentStatus === "paid" || o.paymentStatus === "completed" ? "success" : 
                            o.paymentStatus === "unpaid" || o.paymentStatus === "pending" ? "warn" : "muted"
                          )}
                        >
                          {o.paymentStatus || o.status || "pending"}
                        </span>
                        <span
                          className="pill"
                          style={badgeTone(o.fulfillmentStatus === "fulfilled" ? "info" : "muted")}
                        >
                          {o.fulfillmentStatus || "unfulfilled"}
                        </span>
                        {o.flagged && <span className="pill" style={badgeTone("danger")}>flagged</span>}
                      </div>
                    </Td>
                    <Td align="right">{USD.format(o.total || 0)}</Td>
                  <Td align="center" style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <Link to={`/orders/${o.id}`} style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        textDecoration: "none",
                        color: "#374151",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
                      >View</Link>
                      <button style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
                      onClick={() => openEditModal(o)}>Edit</button>
                      <button style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        color: "#991b1b",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#fef2f2"}
                      onClick={() => handleDeleteOrder(o.id)}>Delete</button>
                    </div>
                  </Td>
                  </tr>
                ))}
                {!paginatedOrders.length && (
                  <tr>
                    <Td colSpan={6} align="center" style={{ padding: 20, color: "var(--muted)" }}>
                      {loading ? "Loading..." : "No orders found"}
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={filtered.length}
                  itemsPerPage={perPage}
                  onItemsPerPageChange={(newPerPage) => {
                    setPerPage(newPerPage);
                    setPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
    
        {/* Create Order Modal */}
        <CreateOrderModal
          open={showCreateOrderModal}
          onClose={() => setShowCreateOrderModal(false)}
          onSave={async (orderData) => {
            try {
              await createOrderFromAdmin(orderData);
              // Refresh orders
              const data = await listOrders({ take: 500 });
              setOrders(Array.isArray(data) ? data : []);
            } catch (error) {
              console.error("Error creating order:", error);
              throw error;
            }
          }}
        />

        {/* Edit Modal */}
        {editingOrder && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal" style={{ maxWidth: 520, width: "100%" }}>
              <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Edit Order #{editingOrder.id.slice(0, 8)}</h3>
                <button
                  onClick={() => setEditingOrder(null)}
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
              
              <div className="grid" style={{ gap: 12 }}>
                <label className="field">
                  <div className="meta">Payment Status</div>
                  <select 
                    className="select" 
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                
                <label className="field">
                  <div className="meta">Fulfillment Status</div>
                  <select 
                    className="select"
                    value={editForm.fulfillmentStatus}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fulfillmentStatus: e.target.value }))}
                  >
                    <option value="unfulfilled">Unfulfilled</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </label>
              </div>
              
              <div className="actions" style={{ marginTop: 16 }}>
                <button
                  onClick={() => setEditingOrder(null)}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateOrder(editingOrder.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "#067D62",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#055A4A"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#067D62"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th
      style={{
        textAlign: align || "left",
        fontWeight: 700,
        padding: "10px 12px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align, colSpan, style }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        textAlign: align || "left",
        padding: "10px 12px",
        verticalAlign: "top",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function badgeTone(kind) {
  switch (kind) {
    case "success":
      return { background: "#eaf8f0", border: "1px solid #d1fae5", color: "#065f46" };
    case "warn":
      return { background: "#fff7e6", border: "1px solid #ffd8a8", color: "#8a5a00" };
    case "info":
      return { background: "#eaf4ff", border: "1px solid #bfdbfe", color: "#1e3a8a" };
    case "danger":
      return { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" };
    case "muted":
      return { background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151" };
    default:
      return { background: "#fff", border: "1px solid #e5e7eb", color: "#111827" };
  }
}
