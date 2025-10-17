// CustomerTickets.jsx - Customer view of their own support tickets
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import { Pagination } from "../components/Pagination";
import { MessageSquare, Plus, Filter, RefreshCw } from "lucide-react";
import CreateSupportTicketModal from "../components/CreateSupportTicketModal";

export default function CustomerTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  
  // Fetch customer's tickets
  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        
        if (!firebaseInitialized || !db || !user) {
          console.warn("Firebase not initialized or no user");
          setTickets([]);
          setLoading(false);
          return;
        }
        
        // Query for tickets - try with orderBy first, fall back to simple query
        let ticketsData = [];
        try {
          const ticketsQuery = query(
            collection(db, "supportTickets"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          const ticketsSnapshot = await getDocs(ticketsQuery);
          ticketsData = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexError) {
          console.warn("Composite index not available, falling back to simple query:", indexError);
          // Fallback: query without orderBy and sort in memory
          const simpleQuery = query(
            collection(db, "supportTickets"),
            where("userId", "==", user.uid)
          );
          const ticketsSnapshot = await getDocs(simpleQuery);
          ticketsData = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Sort in memory
          ticketsData.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime; // descending
          });
        }
        
        console.log("Fetched tickets for user:", user.uid, "Count:", ticketsData.length);
        setTickets(ticketsData);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchTickets();
    }
  }, [user]);
  
  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      
      // Search filter
      if (q) {
        const searchTerm = q.toLowerCase();
        const matchesId = (t.id || "").toLowerCase().includes(searchTerm);
        const matchesSubject = (t.subject || "").toLowerCase().includes(searchTerm);
        const matchesCategory = (t.category || "").toLowerCase().includes(searchTerm);
        
        if (!matchesId && !matchesSubject && !matchesCategory) return false;
      }
      
      return true;
    });
  }, [tickets, statusFilter, q]);
  
  // Calculate ticket metrics
  const ticketMetrics = useMemo(() => {
    const open = filteredTickets.filter(t => t.status === "open").length;
    const inProgress = filteredTickets.filter(t => t.status === "in_progress").length;
    const resolved = filteredTickets.filter(t => t.status === "resolved").length;
    const closed = filteredTickets.filter(t => t.status === "closed").length;
    
    return { open, inProgress, resolved, closed };
  }, [filteredTickets]);
  
  // Paginated tickets
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredTickets.slice(start, end);
  }, [filteredTickets, page, perPage]);
  
  const totalPages = Math.ceil(filteredTickets.length / perPage);
  
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
  
  // Handle ticket creation success
  const handleTicketCreated = () => {
    setShowCreateModal(false);
    // Refresh tickets
    window.location.reload();
  };
  
  // Customer color palette - Orange Theme
  const customerColors = {
    primary: "#FF9900",
    lightOrange: "#FFB84D",
    darkOrange: "#CC7A00",
    textLight: "#FFFFFF",
    textDark: "#0F1111",
    borderLight: "#DDD",
    info: "#007185",
    warning: "#F9C74F",
    danger: "#E53E3E",
  };
  
  // Enhanced box shadow styles
  const cardShadow = {
    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    transition: "all 0.3s cubic-bezier(.25,.8,.25,1)",
  };
  
  if (!user) {
    return (
      <div className="container" style={{ padding: 24 }}>Please log in to view your tickets.</div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Hero Headline */}
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker">My Support</div>
            <h1 style={{ margin: 0 }}>My Tickets</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              View and manage your support tickets
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: customerColors.primary,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = customerColors.darkOrange;
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = customerColors.primary;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            }}
          >
            <Plus size={18} />
            New Ticket
          </button>
        </div>
          
          <div className="card" style={{ 
            padding: 20,
            background: "#fff",
            borderRadius: "12px",
            ...cardShadow
          }}>
            {/* Single Row: Title - Filters - Stats */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, marginBottom: 16 }}>
              {/* Title */}
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#374151", minWidth: "120px" }}>My Tickets</h2>
              
              {/* Filters - Centered */}
              <div
                className="grid"
                style={{ gridTemplateColumns: "2fr 1fr", gap: 6, flex: 1, maxWidth: "400px" }}
              >
                <input
                  className="input"
                  placeholder="Search tickets…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  style={{ fontSize: "13px", padding: "6px 10px" }}
                />
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ fontSize: "13px", padding: "6px 10px" }}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              {/* Ticket Status Mini Stats */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: "280px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>OPEN</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#067D62" }}>{ticketMetrics.open}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>IN PROGRESS</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#F9C74F" }}>{ticketMetrics.inProgress}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>RESOLVED</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#10B981" }}>{ticketMetrics.resolved}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>CLOSED</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#718096" }}>{ticketMetrics.closed}</div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div style={{ padding: 20, paddingTop: 0, textAlign: 'center' }}>Loading your tickets...</div>
            ) : (
              <>
                {filteredTickets.length === 0 ? (
                  <div style={{ 
                    padding: 60, 
                    textAlign: 'center',
                    color: '#718096'
                  }}>
                    <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                      {q || statusFilter !== "all" ? "No tickets found" : "No support tickets yet"}
                    </h3>
                    <p style={{ fontSize: 14, marginBottom: 20 }}>
                      {q || statusFilter !== "all" 
                        ? "Try adjusting your filters" 
                        : "Create your first support ticket to get help from our team"}
                    </p>
                    {!q && statusFilter === "all" && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                          padding: "10px 20px",
                          background: customerColors.primary,
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Create Your First Ticket
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: "auto", borderRadius: 12 }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                        <thead style={{ background: "#f9fafb" }}>
                          <tr>
                            <Th>ID</Th>
                            <Th>Date</Th>
                            <Th>Subject</Th>
                            <Th>Category</Th>
                            <Th>Priority</Th>
                            <Th>Status</Th>
                            <Th align="center">Actions</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTickets.map((t, index) => (
                            <tr key={t.id} style={{ 
                              borderBottom: "1px solid var(--border)",
                              background: index % 2 === 0 ? "#fff" : "#f9fafb"
                            }}>
                              <Td>{t.id.slice(0, 8)}...</Td>
                              <Td>{formatDate(t.createdAt)}</Td>
                              <Td>
                                <div style={{ fontWeight: 600, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {t.subject || "No Subject"}
                                </div>
                              </Td>
                              <Td>
                                <span className="pill" style={{ fontSize: "11px" }}>{t.category || "general"}</span>
                              </Td>
                              <Td>
                                <span
                                  className="pill"
                                  style={badgeTone(
                                    t.priority === "urgent" ? "danger" :
                                    t.priority === "high" ? "warn" :
                                    t.priority === "low" ? "muted" : "info"
                                  )}
                                >
                                  {t.priority || "normal"}
                                </span>
                              </Td>
                              <Td>
                                <span
                                  className="pill"
                                  style={badgeTone(
                                    t.status === "resolved" || t.status === "closed" ? "success" :
                                    t.status === "in_progress" ? "warn" : "info"
                                  )}
                                >
                                  {t.status || "open"}
                                </span>
                              </Td>
                              <Td align="center" style={{ whiteSpace: "nowrap" }}>
                                <button
                                  onClick={() => navigate(`/tickets/${t.id}`)}
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    background: customerColors.primary,
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = customerColors.darkOrange}
                                  onMouseLeave={(e) => e.currentTarget.style.background = customerColors.primary}
                                >
                                  View & Reply
                                </button>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={filteredTickets.length}
                        itemsPerPage={perPage}
                        onItemsPerPageChange={(newPerPage) => {
                          setPerPage(newPerPage);
                          setPage(1);
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}
        </div>

      </div>
      
      {/* Create Ticket Modal */}
      <CreateSupportTicketModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTicketCreated}
      />
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
      return { background: "#ecfdf5", border: "1px solid #d1fae5", color: "#065f46" };
    case "warn":
      return { background: "#fff7e6", border: "1px solid #ffd8a8", color: "#8a5a00" };
    case "info":
      return { background: "#e0f2fe", border: "1px solid #bae6fd", color: "#075985" };
    case "danger":
      return { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" };
    case "muted":
      return { background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151" };
    default:
      return { background: "#fff", border: "1px solid #e5e7eb", color: "#111827" };
  }
}
