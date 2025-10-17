// src/pages/AgentUsers.jsx
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getUsers } from "../services/userService";
import { Pagination } from "../components/Pagination";
import { Users } from "lucide-react";

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
}
function normalizeUser(u, i) {
  return {
    id: u?.id ?? `u-${i}`,
    firstName: typeof u?.firstName === "string" ? u.firstName : "",
    lastName: typeof u?.lastName === "string" ? u.lastName : "",
    email: typeof u?.email === "string" ? u.email : "",
    role: u?.role === "admin" ? "admin" : u?.role === "agent" ? "agent" : "customer",
    orders: typeof u?.orders === "number" ? u.orders : 0,
  };
}

export function AgentUsers() {
  const { user } = useAuth();

  const [q, setQ] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setStatus("loading");
        const data = await getUsers();
        const rows = Array.isArray(data) ? data.map((u, i) => normalizeUser(u, i)) : [];
        if (alive) {
          setUsers(rows);
          setStatus("ready");
        }
      } catch (e) {
        if (alive) {
          setError(e?.message || "Failed to load users");
          setStatus("error");
        }
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      // Agents should only see customers, not other agents or admins
      if (u.role === "admin" || u.role === "agent") return false;
      
      if (term) {
        const hay = `${fullName(u)} ${u.email}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [users, q]);

  // Calculate user metrics
  const userMetrics = useMemo(() => {
    const totalCustomers = filtered.length;
    
    return { totalCustomers };
  }, [filtered]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  }, [filtered, page, perPage]);

  const totalPages = Math.ceil(filtered.length / perPage);

  const isAgent = !!user && user.role === "agent";

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

  return !isAgent ? (
    <div className="container" style={{ padding: 24 }}>Access denied.</div>
  ) : (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%)" }}>
      <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Hero Headline */}
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker">Agent</div>
            <h1 style={{ margin: 0 }}>Customers</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              View and manage customer information
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

          {status === "loading" && <div className="card" style={{ padding: 16, background: "#fff", borderRadius: "12px", ...cardShadow }}>Loading customers…</div>}
          {status === "error" && <div className="card" style={{ padding: 16, color: "var(--danger, #991b1b)", background: "#fff", borderRadius: "12px", ...cardShadow }}>Failed to load customers: {error}</div>}

          {status === "ready" && (
            <div className="card" style={{ 
              padding: 20,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              <>
                {/* Single Row: Title - Filters - Stats */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, marginBottom: 16 }}>
                  {/* Title */}
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: agentColors.darkBlue, minWidth: "130px" }}>Customer List</h2>
                  
                  {/* Filters - Centered */}
                  <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 6, flex: 1, maxWidth: "400px" }}>
                    <input className="input" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: "13px", padding: "6px 10px" }} />
                  </div>
                  
                  {/* Customer Stats */}
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: "150px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>TOTAL CUSTOMERS</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: agentColors.primary }}>{userMetrics.totalCustomers}</div>
                    </div>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th align="right">Orders</Th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((p, index) => (
                <tr key={p.id} style={{ 
                  borderBottom: "1px solid var(--border)",
                  background: index % 2 === 0 ? "#fff" : "#f9fafb"
                }}>
                  <Td>{fullName(p) || "—"}</Td>
                  <Td>{p.email}</Td>
                  <Td><span className="pill">{p.role}</span></Td>
                  <Td align="right">{p.orders}</Td>
                </tr>
              ))}
              {!paginatedUsers.length && (
                <tr>
                  <Td colSpan={4} align="center" style={{ padding: 20, color: "var(--muted)" }}>
                    No customers found
                  </Td>
                </tr>
              )}
            </tbody>
                </table>

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
            </div>
        )}
      </div>
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th style={{ textAlign: align || "left", fontWeight: 700, padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
      {children}
    </th>
  );
}

function Td({ children, align, colSpan, style }) {
  return (
    <td colSpan={colSpan} style={{ textAlign: align || "left", padding: "10px 12px", verticalAlign: "top", ...style }}>
      {children}
    </td>
  );
}
