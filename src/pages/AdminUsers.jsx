// src/pages/AdminUsers.jsx
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import AdminUserModal from "../components/AdminUserModal.jsx";
import { getUsers, createUser, updateUser, deleteUser } from "../services/userService";
import { Pagination } from "../components/Pagination";
import BreadcrumbNav from "../components/BreadcrumbNav";
import { UserPlus } from "lucide-react";
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
    role: u?.role === "admin" ? "admin" : "customer",
    orders: typeof u?.orders === "number" ? u.orders : 0,
  };
}

export function AdminUsers() {
  const { user } = useAuth();
  const { totalHeaderHeight } = useTotalHeaderHeight();

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

  return !isAdmin ? (
    <div className="container" style={{ padding: 24 }}>Access denied.</div>
  ) : (
    <>
      <BreadcrumbNav
        currentPage="Customers"
        backButton={{ label: "Back to Dashboard", path: "/admin" }}
        rightActions={
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)",
            padding: "6px 10px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0, 113, 133, 0.15)"
          }}>
            <button 
              onClick={openCreate} 
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#00695c",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                borderRadius: 6,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.4)"}
              onMouseLeave={(e) => e.target.style.background = "none"}
            >
              <UserPlus style={{ width: 16, height: 16 }} />
              Add User
            </button>
          </div>
        }
      />
      
      <div className="container-xl" style={{ paddingTop: totalHeaderHeight, paddingBottom: 24 }}>
        <div className="hero-headline" style={{ marginBottom: 8, marginTop: -8 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 0 }}>Admin</div>
            <h1 style={{ margin: 0 }}>Customers</h1>
          </div>
        </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 10 }}>
        <input className="input" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
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
                <Th align="center">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <Td>{fullName(p) || "—"}</Td>
                  <Td>{p.email}</Td>
                  <Td><span className="pill">{p.role}</span></Td>
                  <Td align="right">{p.orders}</Td>
                  <Td align="center">
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      <button className="btn btn-secondary btn-slim" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-secondary btn-slim" onClick={() => openDelete(p)}>Delete</button>
                    </div>
                  </Td>
                </tr>
              ))}
              {!paginatedUsers.length && (
                <tr>
                  <Td colSpan={5} align="center" style={{ padding: 20, color: "var(--muted)" }}>
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

      <AdminUserModal
        open={modalOpen}
        mode={modalMode}
        initialUser={activeUser}
        onClose={() => setModalOpen(false)}
        onSave={modalMode === "create" ? handleCreate : handleEdit}
        onDelete={handleDelete}
      />
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
