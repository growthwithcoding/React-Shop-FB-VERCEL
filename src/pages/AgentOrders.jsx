// AgentOrders.jsx - Agent view of all customer orders with admin-style layout
import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { listOrders } from "../services/orderService";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import { Pagination } from "../components/Pagination";
import { FilteredResultsFeedback } from "../components/dashboard/FilteredResultsFeedback";
import { getDateFromTimestamp, toISODate } from "../lib/utils";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function AgentOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange, filters, searchQuery } = useDashboard();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  
  // Redirect non-agents
  useEffect(() => {
    if (user && user.role !== "agent") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch all orders
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const ordersData = await listOrders({ take: 1000 });
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.role === "agent") {
      fetchOrders();
    }
  }, [user]);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  
  // Filter orders by all criteria
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Local status filter
      if (status === "paid" && o.paymentStatus !== "paid") return false;
      if (status === "unpaid" && o.paymentStatus !== "unpaid") return false;
      if (status === "fulfilled" && o.fulfillmentStatus !== "fulfilled") return false;
      if (status === "unfulfilled" && o.fulfillmentStatus !== "unfulfilled") return false;
      
      // Local date filters (take precedence if set)
      const orderDate = o.createdAt?.toDate?.()?.toISOString().split('T')[0] || 
                        new Date(o.createdAt?.seconds * 1000).toISOString().split('T')[0];
      if (from && orderDate < from) return false;
      if (to && orderDate > to) return false;
      
      // If no local date filters, use global date range
      if (!from && !to) {
        const globalOrderDate = toISODate(getDateFromTimestamp(o.createdAt));
        if (globalOrderDate < dateRange.from || globalOrderDate > dateRange.to) return false;
      }
      
      // Global fulfillment status filter (if no local status is set)
      if (status === "all" && filters.fulfillmentStatus !== "all") {
        const fulfillment = o.fulfillmentStatus || o.fulfillment || "unfulfilled";
        if (fulfillment !== filters.fulfillmentStatus) return false;
      }
      
      // Category filter
      if (filters.category !== "all") {
        const hasCategory = o.items?.some(item => item.category === filters.category);
        if (!hasCategory) return false;
      }
      
      // Channel filter
      if (filters.channel !== "all" && o.channel) {
        if (o.channel !== filters.channel) return false;
      }
      
      // Region filter
      if (filters.region !== "all" && o.region) {
        if (o.region !== filters.region) return false;
      }
      
      // Search query filter (both local and global)
      const searchTerm = (q || searchQuery || "").toLowerCase();
      if (searchTerm) {
        const matchesId = (o.id || "").toLowerCase().includes(searchTerm);
        const matchesCustomer = (o.customerName || o.customer || "").toLowerCase().includes(searchTerm);
        const matchesEmail = (o.customerEmail || o.email || "").toLowerCase().includes(searchTerm);
        const customerName = o.shippingAddressSnapshot?.fullName || o.billingAddressSnapshot?.fullName || "";
        const matchesName = customerName.toLowerCase().includes(searchTerm);
        
        if (!matchesId && !matchesCustomer && !matchesEmail && !matchesName) return false;
      }
      
      return true;
    });
  }, [orders, dateRange, filters, searchQuery, q, status, from, to]);
  
  // Calculate attention metrics for inline stats
  const attentionMetrics = useMemo(() => {
    const unpaid = filteredOrders.filter(o => 
      o.paymentStatus === "unpaid" || o.paymentStatus === "pending" || o.status === "unpaid"
    ).length;
    
    const unfulfilled = filteredOrders.filter(o => {
      const paymentStatus = o.paymentStatus || o.status || "pending";
      const fulfillmentStatus = o.fulfillmentStatus || o.fulfillment || "unfulfilled";
      return (paymentStatus === "paid" || paymentStatus === "completed") && 
        fulfillmentStatus === "unfulfilled";
    }).length;
    
    const flagged = filteredOrders.filter(o => o.flagged === true).length;
    
    return { unpaid, unfulfilled, flagged };
  }, [filteredOrders]);
  
  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, page, perPage]);
  
  const totalPages = Math.ceil(filteredOrders.length / perPage);
  
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
  
  // Agent color palette - Light Blue Theme
  const agentColors = {
    primary: "#3b82f6",
    lightBlue: "#60a5fa",
    darkBlue: "#1e3a8a",
    skyBlue: "#0ea5e9",
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
  
  if (!user || user.role !== "agent") {
    return (
      <div className="container" style={{ padding: 24 }}>Access denied.</div>
    );
  }
  
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%)" }}>
      <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Hero Headline */}
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker">Agent</div>
            <h1 style={{ margin: 0 }}>All Orders</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              View and manage all customer orders
            </div>
          </div>
          <Link 
            to="/agent" 
            className="btn btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              whiteSpace: "nowrap"
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
          
          {/* Filtered Results Feedback */}
          <FilteredResultsFeedback 
            resultCount={filteredOrders.length} 
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
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: agentColors.darkBlue, minWidth: "120px" }}>Orders List</h2>
              
              {/* Filters - Centered */}
              <div
                className="grid"
                style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 6, flex: 1, maxWidth: "700px" }}
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
                </select>
                <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ fontSize: "13px", padding: "6px 10px" }} />
                <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ fontSize: "13px", padding: "6px 10px" }} />
              </div>
              
              {/* Order Status Mini Stats */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: "250px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>UNPAID</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#F9C74F" }}>{attentionMetrics.unpaid}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>UNFULFILLED</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#3b82f6" }}>{attentionMetrics.unfulfilled}</div>
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
                    totalItems={filteredOrders.length}
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
