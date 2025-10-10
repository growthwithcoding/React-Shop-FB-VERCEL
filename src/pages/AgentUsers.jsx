// src/pages/AgentUsers.jsx
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { getUsers } from "../services/userService";
import { Pagination } from "../components/Pagination";
import BreadcrumbNav from "../components/BreadcrumbNav";
import { useTotalHeaderHeight } from "../hooks/useTotalHeaderHeight";

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
  const totalHeaderHeight = useTotalHeaderHeight();

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");

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
      
      if (role !== "all" && u.role !== role) return false;
      if (term) {
        const hay = `${fullName(u)} ${u.email}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [users, q, role]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  }, [filtered, page, perPage]);

  const totalPages = Math.ceil(filtered.length / perPage);

  const isAgent = !!user && user.role === "agent";

  return !isAgent ? (
    <div className="container" style={{ padding: 24 }}>Access denied.</div>
  ) : (
    <>
      <BreadcrumbNav
        currentPage="Customers"
        backButton={{ label: "Back to Dashboard", path: "/agent" }}
      />
      
      <div className="container-xl" style={{ paddingTop: totalHeaderHeight + 24, paddingBottom: 24 }}>
        <div className="hero-headline" style={{ marginBottom: 8 }}>
          <div>
            <div className="kicker">Agent</div>
            <h1 style={{ margin: 0 }}>Customers</h1>
          </div>
        </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 10 }}>
        <input className="input" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All Customers</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {status === "loading" && <div className="card" style={{ padding: 16 }}>Loading users…</div>}
      {status === "error" && <div className="card" style={{ padding: 16, color: "var(--danger, #991b1b)" }}>Failed to load users: {error}</div>}

      {status === "ready" && (
        <div className="card" style={{ padding: 0 }}>
          <>
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
              {paginatedUsers.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
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
    </>
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
