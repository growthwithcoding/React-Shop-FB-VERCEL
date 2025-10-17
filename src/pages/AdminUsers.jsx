// src/pages/AdminUsers.jsx
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AdminUserModal from "../components/AdminUserModal.jsx";
import { getUsers, createUser, updateUser, deleteUser } from "../services/userService";
import { Pagination } from "../components/Pagination";
import { UserPlus } from "lucide-react";

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
}
function normalizeUser(u, i) {
  return {
    id: u?.id ?? `u-${i}`,
    firstName: typeof u?.firstName === "string" ? u.firstName : "",
    lastName: typeof u?.lastName === "string" ? u.lastName : "",
    email: typeof u?.email === "string" ? u.email : "",
    role: u?.role === "admin" ? "admin" : "customer",
    orders: typeof u?.orders === "number" ? u.orders : 0,
  };
}

export function AdminUsers() {
  const { user } = useAuth();

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit | delete
  const [activeUser, setActiveUser] = useState(null);

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
      if (role !== "all" && u.role !== role) return false;
      if (term) {
        const hay = `${fullName(u)} ${u.email}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [users, q, role]);

  // Calculate user metrics
  const userMetrics = useMemo(() => {
    const totalUsers = filtered.length;
    const totalAdmins = filtered.filter(u => u.role === "admin").length;
    const totalCustomers = filtered.filter(u => u.role === "customer").length;
    
    return { totalUsers, totalAdmins, totalCustomers };
  }, [filtered]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  }, [filtered, page, perPage]);

  const totalPages = Math.ceil(filtered.length / perPage);

  const isAdmin = !!user && user.role === "admin";

  async function handleCreate(draft) {
    const tempId = (crypto.randomUUID && crypto.randomUUID()) || `tmp_${Date.now()}`;
    const temp = normalizeUser({ id: tempId, ...draft }, users.length);
    setUsers((prev) => [temp, ...prev]);
    try {
      const saved = await createUser({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        role: draft.role,
      });
      const norm = normalizeUser(saved, 0);
      setUsers((prev) => prev.map((u) => (u.id === tempId ? norm : u)));
    } catch (e) {
      setUsers((prev) => prev.filter((u) => u.id !== tempId));
      throw e;
    }
  }

  async function handleEdit(draft) {
    if (!activeUser) return;
    const nextLocal = normalizeUser({ ...activeUser, ...draft }, 0);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? nextLocal : u)));
    try {
      await updateUser({
        id: activeUser.id,
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        role: draft.role,
      });
    } catch (e) {
      try {
        const data = await getUsers();
        setUsers((Array.isArray(data) ? data : []).map((u, i) => normalizeUser(u, i)));
      } catch {
        // Ignore reload errors, will throw original error below
      }
      throw e;
    }
  }

  async function handleDelete() {
    if (!activeUser) return;
    const removed = activeUser;
    setUsers((prev) => prev.filter((u) => u.id !== removed.id));
    try {
      await deleteUser(removed.id);
    } catch (e) {
      setUsers((prev) => [removed, ...prev]);
      throw e;
    }
  }

  function openCreate() {
    setActiveUser(null);
    setModalMode("create");
    setModalOpen(true);
  }
  function openEdit(u) {
    setActiveUser(u);
    setModalMode("edit");
    setModalOpen(true);
  }
  function openDelete(u) {
    setActiveUser(u);
    setModalMode("delete");
    setModalOpen(true);
  }

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
            <h1 style={{ margin: 0 }}>Users</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Manage user accounts and permissions
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
              onClick={openCreate}
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
              <UserPlus size={14} />
              Add User
            </button>
          </div>
        </div>

          {status === "loading" && <div className="card" style={{ padding: 16, background: "#fff", borderRadius: "12px", ...cardShadow }}>Loading users…</div>}
          {status === "error" && <div className="card" style={{ padding: 16, color: "var(--danger, #991b1b)", background: "#fff", borderRadius: "12px", ...cardShadow }}>Failed to load users: {error}</div>}

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
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: amazonColors.darkBg, minWidth: "100px" }}>Users List</h2>
                  
                  {/* Filters - Centered */}
                  <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 6, flex: 1, maxWidth: "500px" }}>
                    <input className="input" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: "13px", padding: "6px 10px" }} />
                    <select className="select" value={role} onChange={(e) => setRole(e.target.value)} style={{ fontSize: "13px", padding: "6px 10px" }}>
                      <option value="all">All roles</option>
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  {/* User Stats - By Role */}
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: "280px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>TOTAL</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: amazonColors.darkBg }}>{userMetrics.totalUsers}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>ADMINS</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: amazonColors.danger }}>{userMetrics.totalAdmins}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>CUSTOMERS</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: amazonColors.accentBlue }}>{userMetrics.totalCustomers}</div>
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
                <Th align="center">Actions</Th>
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
                  <Td align="center" style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
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
                      onClick={() => openEdit(p)}>Edit</button>
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
                      onClick={() => openDelete(p)}>Delete</button>
                    </div>
                  </Td>
                </tr>
              ))}
              {!paginatedUsers.length && (
                <tr>
                  <Td colSpan={5} align="center" style={{ padding: 20, color: "var(--muted)" }}>
                    No users found
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

        <AdminUserModal
          open={modalOpen}
          mode={modalMode}
          initialUser={activeUser}
          onClose={() => setModalOpen(false)}
          onSave={modalMode === "create" ? handleCreate : handleEdit}
          onDelete={handleDelete}
        />
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
