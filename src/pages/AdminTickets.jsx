// AdminTickets.jsx - Admin view of all support tickets with admin-style layout
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import { Pagination } from "../components/Pagination";
import { MessageSquare, AlertTriangle, Download, Filter, RefreshCw, BarChart3, StickyNote, Users } from "lucide-react";

export default function AdminTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  
  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch all tickets
  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        
        if (!firebaseInitialized || !db) {
          console.warn("Firebase not initialized");
          setTickets([]);
          setLoading(false);
          return;
        }
        
        const ticketsQuery = query(
          collection(db, "supportTickets"),
          orderBy("createdAt", "desc")
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsData = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setTickets(ticketsData);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.role === "admin") {
      fetchTickets();
    }
  }, [user]);
  
  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      
      // Priority filter
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      
      // Search filter
      if (q) {
        const searchTerm = q.toLowerCase();
        const matchesId = (t.id || "").toLowerCase().includes(searchTerm);
        const matchesSubject = (t.subject || "").toLowerCase().includes(searchTerm);
        const matchesCategory = (t.category || "").toLowerCase().includes(searchTerm);
        const matchesEmail = (t.email || "").toLowerCase().includes(searchTerm);
        
        if (!matchesId && !matchesSubject && !matchesCategory && !matchesEmail) return false;
      }
      
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, q]);
  
  // Calculate ticket metrics
  const ticketMetrics = useMemo(() => {
    const open = filteredTickets.filter(t => t.status === "open").length;
    const inProgress = filteredTickets.filter(t => t.status === "in_progress").length;
    const resolved = filteredTickets.filter(t => t.status === "resolved").length;
    const urgent = filteredTickets.filter(t => 
      t.priority === "urgent" && (t.status === "open" || t.status === "in_progress")
    ).length;
    
    return { open, inProgress, resolved, urgent };
  }, [filteredTickets]);
  
  // Paginated tickets
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredTickets.slice(start, end);
  }, [filteredTickets, page, perPage]);
  
  const totalPages = Math.ceil(filteredTickets.length / perPage);
  
  // Handle ticket status change
  const handleStatusChange = async (ticketId, newStatus) => {
    if (!firebaseInitialized || !db) {
      console.warn("Firebase not initialized");
      return;
    }
    
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error("Error updating ticket status:", error);
      alert("Failed to update ticket status");
    }
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
  
  // Admin color palette - Orange Theme
  const adminColors = {
    primary: "#FF9900",
    lightOrange: "#FFB84D",
    darkOrange: "#CC7A00",
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
  
  if (!user || user.role !== "admin") {
    return (
      <div className="container" style={{ padding: 24 }}>Access denied.</div>
    );
  }
  
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
      <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Hero Headline */}
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker">Admin</div>
            <h1 style={{ margin: 0 }}>Support Tickets</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Manage all customer support tickets and inquiries
            </div>
          </div>
          <Link 
            to="/admin" 
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
          
          <div className="card" style={{ 
            padding: 20,
            background: "#fff",
            borderRadius: "12px",
            ...cardShadow
          }}>
            {/* Single Row: Title - Filters - Stats */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, marginBottom: 16 }}>
              {/* Title */}
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: adminColors.darkOrange, minWidth: "120px" }}>Tickets List</h2>
              
              {/* Filters - Centered */}
              <div
                className="grid"
                style={{ gridTemplateColumns: "2fr 1fr 1fr", gap: 6, flex: 1, maxWidth: "600px" }}
              >
                <input
                  className="input"
                  placeholder="Search ID, subject, email…"
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
                <select
                  className="select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{ fontSize: "13px", padding: "6px 10px" }}
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              {/* Ticket Status Mini Stats */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: "320px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>OPEN</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#FF9900" }}>{ticketMetrics.open}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>IN PROGRESS</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#F9C74F" }}>{ticketMetrics.inProgress}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>RESOLVED</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#067D62" }}>{ticketMetrics.resolved}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>URGENT</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#E53E3E" }}>{ticketMetrics.urgent}</div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div style={{ padding: 20, paddingTop: 0, textAlign: 'center' }}>Loading tickets...</div>
            ) : (
              <>
                <div style={{ overflowX: "auto", borderRadius: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead style={{ background: "#f9fafb" }}>
                      <tr>
                        <Th>ID</Th>
                        <Th>Date</Th>
                        <Th>Subject</Th>
                        <Th>Customer</Th>
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
                            <div style={{ fontWeight: 600, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.subject || "No Subject"}
                            </div>
                          </Td>
                          <Td 
                            onDoubleClick={() => navigate(`/tickets/${t.id}`)}
                            style={{ cursor: "pointer" }}
                            title="Double-click to view ticket"
                          >
                            <div className="meta" style={{ fontSize: "12px" }}>{t.email || "—"}</div>
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
                            <select
                              value={t.status || "open"}
                              onChange={(e) => handleStatusChange(t.id, e.target.value)}
                              style={{
                                padding: "4px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                background: 
                                  t.status === "open" ? "#fff5e6" :
                                  t.status === "in_progress" ? "#fff7e6" :
                                  t.status === "resolved" ? "#eaf8f0" : "#f3f4f6",
                                color:
                                  t.status === "open" ? "#CC7A00" :
                                  t.status === "in_progress" ? "#8a5a00" :
                                  t.status === "resolved" ? "#065f46" : "#374151",
                                cursor: "pointer"
                              }}
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </Td>
                          <Td align="center" style={{ whiteSpace: "nowrap" }}>
                            <button
                              onClick={() => navigate(`/tickets/${t.id}`)}
                              style={{
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
                            >
                              View
                            </button>
                          </Td>
                        </tr>
                      ))}
                      {!paginatedTickets.length && (
                        <tr>
                          <Td colSpan={8} align="center" style={{ padding: 20, color: "var(--muted)" }}>
                            {loading ? "Loading..." : "No tickets found"}
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
        </div>

        {/* Quick Actions Section - Admin Full Control */}
        <div className="card" style={{ 
          padding: 20,
          background: "#fff",
          borderRadius: "12px",
          marginTop: 24,
          ...cardShadow
        }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: adminColors.darkOrange }}>
              Admin Full Control
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6B7280" }}>
              Complete ticket management and system controls
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <button 
              onClick={() => {
                setStatusFilter("open");
                setPage(1);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fff5e6",
                border: "2px solid #ffe6cc",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: adminColors.darkOrange,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffedcc";
                e.currentTarget.style.borderColor = "#ffd699";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff5e6";
                e.currentTarget.style.borderColor = "#ffe6cc";
              }}
            >
              <MessageSquare size={18} />
              View Open Tickets
            </button>
            
            <button 
              onClick={() => {
                setPriorityFilter("urgent");
                setPage(1);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fff5e6",
                border: "2px solid #ffe6cc",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: adminColors.darkOrange,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffedcc";
                e.currentTarget.style.borderColor = "#ffd699";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff5e6";
                e.currentTarget.style.borderColor = "#ffe6cc";
              }}
            >
              <AlertTriangle size={18} />
              Urgent Tickets
            </button>
            
            <button 
              onClick={() => {
                setQ("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setPage(1);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fff5e6",
                border: "2px solid #ffe6cc",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: adminColors.darkOrange,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffedcc";
                e.currentTarget.style.borderColor = "#ffd699";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff5e6";
                e.currentTarget.style.borderColor = "#ffe6cc";
              }}
            >
              <Filter size={18} />
              Clear All Filters
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fff5e6",
                border: "2px solid #ffe6cc",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: adminColors.darkOrange,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffedcc";
                e.currentTarget.style.borderColor = "#ffd699";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff5e6";
                e.currentTarget.style.borderColor = "#ffe6cc";
              }}
            >
              <RefreshCw size={18} />
              Refresh Data
            </button>

            <button 
              onClick={() => {
                const csvContent = [
                  ['ID', 'Date', 'Subject', 'Email', 'Category', 'Priority', 'Status'],
                  ...filteredTickets.map(t => [
                    t.id,
                    formatDate(t.createdAt),
                    t.subject || 'No Subject',
                    t.email || '',
                    t.category || 'general',
                    t.priority || 'normal',
                    t.status || 'open'
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fff5e6",
                border: "2px solid #ffe6cc",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: adminColors.darkOrange,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffedcc";
                e.currentTarget.style.borderColor = "#ffd699";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff5e6";
                e.currentTarget.style.borderColor = "#ffe6cc";
              }}
            >
              <Download size={18} />
              Export to CSV
            </button>

            <button 
              onClick={() => navigate('/admin')}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fff5e6",
                border: "2px solid #ffe6cc",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: adminColors.darkOrange,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffedcc";
                e.currentTarget.style.borderColor = "#ffd699";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff5e6";
                e.currentTarget.style.borderColor = "#ffe6cc";
              }}
            >
              <BarChart3 size={18} />
              View Analytics
            </button>

            <button 
              onClick={() => {
                const note = prompt("Add internal note about customer account:");
                if (note && note.trim()) {
                  alert(`Note saved: "${note}"\n(Demo mode - note not actually saved)`);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fff5e6",
                border: "2px solid #ffe6cc",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: adminColors.darkOrange,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffedcc";
                e.currentTarget.style.borderColor = "#ffd699";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff5e6";
                e.currentTarget.style.borderColor = "#ffe6cc";
              }}
            >
              <StickyNote size={18} />
              Add Account Note
            </button>

            <button 
              onClick={() => navigate('/admin/users')}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fff5e6",
                border: "2px solid #ffe6cc",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: adminColors.darkOrange,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffedcc";
                e.currentTarget.style.borderColor = "#ffd699";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff5e6";
                e.currentTarget.style.borderColor = "#ffe6cc";
              }}
            >
              <Users size={18} />
              View Customer Profiles
            </button>
          </div>
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
      return { background: "#fff5e6", border: "1px solid #ffe6cc", color: "#CC7A00" };
    case "danger":
      return { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" };
    case "muted":
      return { background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151" };
    default:
      return { background: "#fff", border: "1px solid #e5e7eb", color: "#111827" };
  }
}
