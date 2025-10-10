// src/pages/AdminOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { listOrders, updateOrder, deleteOrder } from "../services/orderService";
import { useDashboard } from "../hooks/useDashboard";
import { Pagination } from "../components/Pagination";
import { FilteredResultsFeedback } from "../components/dashboard/FilteredResultsFeedback";
import BreadcrumbNav from '../components/BreadcrumbNav';
import { useTotalHeaderHeight } from "../hooks/useTotalHeaderHeight";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function AdminOrders() {
  const { user } = useAuth();
  const { totalHeaderHeight } = useTotalHeaderHeight();
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

  return !isAdmin ? (
    <div className="container" style={{ padding: 24 }}>Access denied.</div>
  ) : (
    <>
      <BreadcrumbNav
        currentPage="Orders"
        backButton={{ label: "Back to Dashboard", path: "/admin" }}
      />
      
      <div className="container-xl" style={{ paddingTop: totalHeaderHeight, paddingBottom: 24 }}>
        <div className="hero-headline" style={{ marginBottom: 8, marginTop: -8 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 0 }}>Admin</div>
            <h1 style={{ margin: 0 }}>Orders</h1>
          </div>
        </div>
      
      {/* Filtered Results Feedback */}
      <FilteredResultsFeedback 
        resultCount={filtered.length} 
        totalCount={orders.length} 
        entityName="orders" 
      />

      {/* Filters */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}
      >
        <input
          className="input"
          placeholder="Search ID, customer…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="unfulfilled">Unfulfilled</option>
          <option value="flagged">Flagged</option>
          <option value="refunded">Refunded</option>
        </select>
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Min $"
          value={min}
          onChange={(e) => setMin(e.target.value)}
        />
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Max $"
          value={max}
          onChange={(e) => setMax(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>Loading orders...</div>
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
                  {paginatedOrders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
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
                      <Td align="center">
                        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                          <Link to={`/orders/${o.id}`} className="btn btn-secondary btn-slim">View</Link>
                          <button className="btn btn-secondary btn-slim" onClick={() => openEditModal(o)}>Edit</button>
                          <button className="btn btn-secondary btn-slim" onClick={() => handleDeleteOrder(o.id)}>Delete</button>
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
      
      {/* Edit Modal */}
      {editingOrder && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 520, width: "100%" }}>
            <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Edit Order #{editingOrder.id.slice(0, 8)}</h3>
              <button className="btn btn-secondary btn-slim" onClick={() => setEditingOrder(null)}>Close</button>
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
              <button className="btn btn-secondary" onClick={() => setEditingOrder(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleUpdateOrder(editingOrder.id)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
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
