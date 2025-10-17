// AgentMyOrders.jsx - Agent's personal orders page
import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { listOrders } from "../services/orderService";
import { useNavigate } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { Package } from "lucide-react";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function AgentMyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  
  // Redirect non-agents
  useEffect(() => {
    if (user && user.role !== "agent") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch agent's own orders only
  useEffect(() => {
    async function fetchMyOrders() {
      try {
        setLoading(true);
        const allOrders = await listOrders({ take: 1000 });
        // Filter to only show orders placed by this agent
        const myOrders = allOrders.filter(o => o.userId === user?.uid);
        setOrders(Array.isArray(myOrders) ? myOrders : []);
      } catch (error) {
        console.error("Error fetching my orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.role === "agent" && user?.uid) {
      fetchMyOrders();
    }
  }, [user]);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  
  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Local status filter
      if (status === "paid" && o.paymentStatus !== "paid") return false;
      if (status === "unpaid" && o.paymentStatus !== "unpaid") return false;
      if (status === "fulfilled" && o.fulfillmentStatus !== "fulfilled") return false;
      if (status === "unfulfilled" && o.fulfillmentStatus !== "unfulfilled") return false;
      
      // Search query filter
      if (q) {
        const searchTerm = q.toLowerCase();
        const matchesId = (o.id || "").toLowerCase().includes(searchTerm);
        
        if (!matchesId) return false;
      }
      
      return true;
    });
  }, [orders, q, status]);
  
  // Calculate order metrics
  const orderMetrics = useMemo(() => {
    const total = filteredOrders.length;
    const unpaid = filteredOrders.filter(o => 
      o.paymentStatus === "unpaid" || o.paymentStatus === "pending" || o.status === "unpaid"
    ).length;
    const unfulfilled = filteredOrders.filter(o => {
      const paymentStatus = o.paymentStatus || o.status || "pending";
      const fulfillmentStatus = o.fulfillmentStatus || o.fulfillment || "unfulfilled";
      return (paymentStatus === "paid" || paymentStatus === "completed") && 
        fulfillmentStatus === "unfulfilled";
    }).length;
    const totalSpent = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    return { total, unpaid, unfulfilled, totalSpent };
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
            <h1 style={{ margin: 0 }}>My Orders</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Track your personal order history and status
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
          
          {/* Summary Stats Card */}
          <div className="card" style={{ 
            padding: 20,
            background: "#fff",
            borderRadius: "12px",
            marginBottom: 16,
            ...cardShadow
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div style={{ 
                padding: "16px",
                background: "linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 50%)",
                borderRadius: "8px",
                border: "2px solid #bfdbfe"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Package size={20} color={agentColors.primary} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#718096" }}>TOTAL ORDERS</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: agentColors.darkBlue }}>{orderMetrics.total}</div>
              </div>
              
              <div style={{ 
                padding: "16px",
                background: "#f0f9ff",
                borderRadius: "8px",
                border: "2px solid #bfdbfe"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#718096" }}>TOTAL SPENT</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: agentColors.primary }}>{USD.format(orderMetrics.totalSpent)}</div>
              </div>
              
              <div style={{ 
                padding: "16px",
                background: "#fff7e6",
                borderRadius: "8px",
                border: "2px solid #ffd8a8"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#718096" }}>UNPAID</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: agentColors.warning }}>{orderMetrics.unpaid}</div>
              </div>
              
              <div style={{ 
                padding: "16px",
                background: "#f0f9ff",
                borderRadius: "8px",
                border: "2px solid #bfdbfe"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#718096" }}>UNFULFILLED</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: agentColors.primary }}>{orderMetrics.unfulfilled}</div>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ 
            padding: 20,
            background: "#fff",
            borderRadius: "12px",
            ...cardShadow
          }}>
            {/* Single Row: Title - Filters */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, marginBottom: 16 }}>
              {/* Title */}
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: agentColors.darkBlue, minWidth: "140px" }}>My Orders List</h2>
              
              {/* Filters - Centered */}
              <div
                className="grid"
                style={{ gridTemplateColumns: "2fr 1fr", gap: 6, flex: 1, maxWidth: "500px" }}
              >
                <input
                  className="input"
                  placeholder="Search order ID…"
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
              </div>
            </div>
            
            {loading ? (
              <div style={{ padding: 20, paddingTop: 0, textAlign: 'center' }}>Loading your orders...</div>
            ) : (
              <>
                <div style={{ overflowX: "auto", borderRadius: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead style={{ background: "#f9fafb" }}>
                      <tr>
                        <Th>Order ID</Th>
                        <Th>Date</Th>
                        <Th>Items</Th>
                        <Th>Payment Status</Th>
                        <Th>Fulfillment</Th>
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
                          <Td>
                            <div style={{ fontFamily: "monospace", fontWeight: 700 }}>{o.id.slice(0, 8)}...</div>
                          </Td>
                          <Td>{formatDate(o.createdAt)}</Td>
                          <Td>
                            <div style={{ fontSize: "13px" }}>{o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}</div>
                          </Td>
                          <Td>
                            <span
                              className="pill"
                              style={badgeTone(
                                o.paymentStatus === "paid" || o.paymentStatus === "completed" ? "success" : 
                                o.paymentStatus === "unpaid" || o.paymentStatus === "pending" ? "warn" : "muted"
                              )}
                            >
                              {o.paymentStatus || o.status || "pending"}
                            </span>
                          </Td>
                          <Td>
                            <span
                              className="pill"
                              style={badgeTone(o.fulfillmentStatus === "fulfilled" ? "info" : "muted")}
                            >
                              {o.fulfillmentStatus || "unfulfilled"}
                            </span>
                          </Td>
                          <Td align="right" style={{ fontWeight: 700 }}>{USD.format(o.total || 0)}</Td>
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
                            >View Details</Link>
                          </Td>
                        </tr>
                      ))}
                      {!paginatedOrders.length && (
                        <tr>
                          <Td colSpan={7} align="center" style={{ padding: 40, color: "var(--muted)" }}>
                            {loading ? "Loading..." : (
                              <div>
                                <Package size={48} style={{ color: "#d1d5db", margin: "0 auto 16px" }} />
                                <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>No orders yet</p>
                                <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>Your order history will appear here</p>
                              </div>
                            )}
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
