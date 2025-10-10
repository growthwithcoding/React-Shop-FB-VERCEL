// src/pages/AdminProducts.jsx
import { useEffect, useMemo, useState } from "react";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../services/productService";
import { useDashboard } from "../hooks/useDashboard";
import { Pagination } from "../components/Pagination";
import BreadcrumbNav from '../components/BreadcrumbNav';
import { Package } from "lucide-react";
import { useTotalHeaderHeight } from "../hooks/useTotalHeaderHeight";

/* --------------------------- helpers / formatters --------------------------- */
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const clamp = (n, min, max) => Math.max(min, Math.min(max, n ?? 0));

function asNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProduct(p) {
  // Allow missing fields from older docs
  return {
    id: p?.id ?? "",
    title: p?.title ?? "",
    price: asNumber(p?.price, 0),
    image: p?.image ?? "",
    description: p?.description ?? "",
    category: p?.category ?? "general",
    sku: p?.sku ?? "",
    stock: asNumber(p?.stock, 0),
    status: p?.status ?? (asNumber(p?.stock, 0) > 0 ? "active" : "inactive"),
  };
}

/* --------------------------------- icons ---------------------------------- */
const IconBox = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 7v10l9 4 9-4V7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 11v10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IconDollar = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 2v20M17 7c0-2.761-2.686-3-5-3s-5 .239-5 3 2 3 5 3 5 .239 5 3-2 3-5 3-5-.239-5-3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IconAlert = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 9v5M12 17.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 3l9 16H3L12 3z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IconCheck = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* --------------------------------- modal ---------------------------------- */
function ProductModal({ open, mode, initial, onClose, onCreate, onUpdate, onDelete }) {
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";

  const [draft, setDraft] = useState({
    title: "",
    price: 0,
    image: "",
    description: "",
    category: "general",
    sku: "",
    stock: 0,
    status: "active",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    setBusy(false);
    if (isEdit && initial) {
      setDraft({
        title: initial.title || "",
        price: asNumber(initial.price, 0),
        image: initial.image || "",
        description: initial.description || "",
        category: initial.category || "general",
        sku: initial.sku || "",
        stock: asNumber(initial.stock, 0),
        status: initial.status || (asNumber(initial.stock, 0) > 0 ? "active" : "inactive"),
      });
    } else if (isCreate) {
      setDraft({ title: "", price: 0, image: "", description: "", category: "general", sku: "", stock: 0, status: "active" });
    }
  }, [open, isCreate, isEdit, initial]);

  if (!open) return null;

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (isDelete) return;
    if (!draft.title.trim()) return setErr("Title is required.");
    if (draft.price < 0) return setErr("Price cannot be negative.");
    if (draft.stock < 0) return setErr("Stock cannot be negative.");
    try {
      setBusy(true);
      if (isCreate) await onCreate?.(draft);
      if (isEdit) await onUpdate?.(draft);
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    try {
      setBusy(true);
      await onDelete?.(initial);
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Failed to delete product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 720, width: "100%" }}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>
            {isCreate && "Add Product"}
            {isEdit && "Edit Product"}
            {isDelete && "Delete Product"}
          </h3>
          <button className="btn btn-secondary btn-slim" onClick={onClose} disabled={busy}>Close</button>
        </div>

        {isDelete ? (
          <>
            <p>Are you sure you want to delete <strong>{initial?.title || "this product"}</strong>?</p>
            {err && <div className="card" style={{ padding: 8, color: "var(--danger, #991b1b)" }}>{err}</div>}
            <div className="actions">
              <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDelete} disabled={busy}>
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Title</div>
                <input className="input" value={draft.title} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Product title" />
              </label>
              <label className="field">
                <div className="meta">Price</div>
                <input className="input" type="number" min="0" step="0.01" value={draft.price}
                  onChange={(e) => setDraft(d => ({ ...d, price: asNumber(e.target.value, 0) }))} />
              </label>
              <label className="field">
                <div className="meta">Stock</div>
                <input className="input" type="number" min="0" step="1" value={draft.stock}
                  onChange={(e) => setDraft(d => ({ ...d, stock: Math.max(0, Math.floor(asNumber(e.target.value, 0))) }))} />
              </label>
              <label className="field">
                <div className="meta">SKU</div>
                <input className="input" value={draft.sku} onChange={(e) => setDraft(d => ({ ...d, sku: e.target.value }))} placeholder="SKU-1234" />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Image URL</div>
                <input className="input" value={draft.image} onChange={(e) => setDraft(d => ({ ...d, image: e.target.value }))} placeholder="https://…" />
              </label>
              <label className="field">
                <div className="meta">Category</div>
                <input className="input" value={draft.category} onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))} placeholder="general" />
              </label>
              <label className="field">
                <div className="meta">Status</div>
                <select className="select" value={draft.status} onChange={(e) => setDraft(d => ({ ...d, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Description</div>
                <textarea className="input" rows={4} value={draft.description}
                  onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))} />
              </label>
            </div>

            {err && <div className="card" style={{ padding: 8, marginTop: 8, color: "var(--danger, #991b1b)" }}>{err}</div>}

            <div className="actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save" : "Create")}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- page body -------------------------------- */
export default function AdminProducts() {
  const { totalHeaderHeight } = useTotalHeaderHeight();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [stockView, setStockView] = useState("all"); // all | low | out | active | inactive
  const { filters } = useDashboard();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit | delete
  const [active, setActive] = useState(null);

  // load data
  async function load() {
    setLoading(true);
    try {
      const all = await listProducts();
      setItems((all || []).map(normalizeProduct));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // derived stats
  const stats = useMemo(() => {
    const total = items.length;
    const totalStock = items.reduce((s, x) => s + (x.stock || 0), 0);
    const low = items.filter(x => x.stock > 0 && x.stock <= 5).length;
    const out = items.filter(x => (x.stock || 0) === 0).length;
    const active = items.filter(x => x.status === "active").length;
    const value = items.reduce((s, x) => s + x.price * (x.stock || 0), 0);
    return { total, totalStock, low, out, active, value };
  }, [items]);

  // filters
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((x) => {
      if (cat !== "all" && (x.category || "general") !== cat) return false;
      if (stockView === "low" && !(x.stock > 0 && x.stock <= 5)) return false;
      if (stockView === "out" && (x.stock || 0) !== 0) return false;
      if (stockView === "active" && x.status !== "active") return false;
      if (stockView === "inactive" && x.status !== "inactive") return false;
      if (s) {
        const hay = `${x.title} ${x.sku} ${x.category}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      
      // Global dashboard filters
      if (filters.category && filters.category !== 'all') {
        if ((x.category || "general") !== filters.category) return false;
      }
      
      return true;
    });
  }, [items, q, cat, stockView, filters]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  }, [filtered, page, perPage]);

  const totalPages = Math.ceil(filtered.length / perPage);

  // categories for filter
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category || "general"));
    return ["all", ...Array.from(set)];
  }, [items]);

  // CRUD handlers via modal
  function openCreate() { setActive(null); setModalMode("create"); setModalOpen(true); }
  function openEdit(p) { setActive(p); setModalMode("edit"); setModalOpen(true); }
  function openDelete(p) { setActive(p); setModalMode("delete"); setModalOpen(true); }

  async function doCreate(draft) {
    await createProduct(draft);
    await load();
  }
  async function doUpdate(draft) {
    await updateProduct(active.id, draft);
    await load();
  }
  async function doDelete() {
    await deleteProduct(active.id);
    await load();
  }

  /* ------------------------------- rendering ------------------------------- */
  return (
    <>
      <BreadcrumbNav
        currentPage="Products"
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
              type="button" 
              onClick={openCreate}
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
              <Package style={{ width: 16, height: 16 }} />
              Add Product
            </button>
          </div>
        }
      />
      
      <div className="container-xl" style={{ paddingTop: totalHeaderHeight, paddingBottom: 24 }}>
        {/* Header */}
        <div className="hero-headline" style={{ marginBottom: 8, marginTop: -8 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 0 }}>Admin</div>
            <h1 style={{ margin: 0 }}>Products</h1>
          </div>
        </div>

      {/* KPI widgets */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
        <StatCard icon={<IconBox />} title="Products" value={stats.total} />
        <StatCard icon={<IconCheck />} title="Active" value={stats.active} />
        <StatCard icon={<IconAlert />} title="Low stock" value={stats.low} tone="warn" />
        <StatCard icon={<IconAlert />} title="Out of stock" value={stats.out} tone="danger" />
        <StatCard icon={<IconDollar />} title="Inventory value" value={USD.format(stats.value)} />
      </div>

      {/* Filters row */}
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8 }}>
          <input className="input" placeholder="Search title, SKU, category…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select className="select" value={stockView} onChange={(e) => setStockView(e.target.value)}>
            <option value="all">All stock</option>
            <option value="low">Low (≤5)</option>
            <option value="out">Out of stock</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <button className="btn btn-secondary" type="button" onClick={() => { setQ(""); setCat("all"); setStockView("all"); }}>
            Reset
          </button>
        </div>
      </div>

      {/* Catalog */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 16 }}>Loading…</div>
        ) : (
          <>
            <div style={{ overflowX: "auto", borderRadius: 12 }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th align="right">Price</Th>
                  <Th align="center">Inventory</Th>
                  <Th align="center">Status</Th>
                  <Th align="center">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <Td>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <img
                          src={p.image || "https://via.placeholder.com/64"}
                          alt=""
                          width={48}
                          height={48}
                          style={{ objectFit: "contain", background: "#fff", border: "1px solid #eee", borderRadius: 8 }}
                        />
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.title || "Untitled"}</div>
                          <div className="meta">{p.description?.slice(0, 64) || "—"}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{p.sku || "—"}</Td>
                    <Td>{p.category || "general"}</Td>
                    <Td align="right">{USD.format(p.price)}</Td>
                    <Td align="center">
                      <InventoryBadge stock={p.stock} />
                    </Td>
                    <Td align="center">
                      <span className="pill" style={pillTone(p.status === "active" ? "success" : "muted")}>
                        {p.status || "inactive"}
                      </span>
                    </Td>
                    <Td align="center">
                      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                        <button className="btn btn-secondary btn-slim" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-secondary btn-slim" onClick={() => openDelete(p)}>Delete</button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {!paginatedItems.length && (
                  <tr>
                    <Td colSpan={7} align="center" style={{ padding: 20, color: "var(--muted)" }}>
                      No products found
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

      {/* Modal */}
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initial={active}
        onClose={() => setModalOpen(false)}
        onCreate={doCreate}
        onUpdate={doUpdate}
        onDelete={doDelete}
      />
      </div>
    </>
  );
}

/* ------------------------------ subcomponents ------------------------------ */
function StatCard({ icon, title, value, tone }) {
  const styles = {
    base: { background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 12 },
    icon: { display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)" },
    title: { fontSize: 12, color: "var(--muted)" },
    value: { fontWeight: 800, fontSize: 18 },
  };
  const toneStyle =
    tone === "warn" ? { color: "#8a5a00", background: "#fff7e6", borderColor: "#ffd8a8" } :
    tone === "danger" ? { color: "#991b1b", background: "#fef2f2", borderColor: "#fecaca" } :
    {};
  return (
    <div className="card" style={styles.base}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ ...styles.icon, ...toneStyle }}>{icon}</div>
        <div>
          <div style={styles.title}>{title}</div>
          <div style={styles.value}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function InventoryBadge({ stock }) {
  const n = clamp(stock, 0, 99999);
  let tone = "success";
  if (n === 0) tone = "danger";
  else if (n <= 5) tone = "warn";
  const color =
    tone === "success" ? "#065f46" :
    tone === "warn" ? "#8a5a00" :
    "#991b1b";
  const bg =
    tone === "success" ? "#eaf8f0" :
    tone === "warn" ? "#fff7e6" :
    "#fef2f2";
  const border =
    tone === "success" ? "#d1fae5" :
    tone === "warn" ? "#ffd8a8" :
    "#fecaca";

  const pct = clamp(n / 20 * 100, 0, 100); // simple progress viz vs 20 as "healthy" heuristic

  return (
    <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
      <span className="pill" style={{ background: bg, border: `1px solid ${border}`, color }}>
        {n === 0 ? "Out of stock" : n <= 5 ? `Low • ${n}` : `In stock • ${n}`}
      </span>
      <div style={{ width: 128, height: 6, background: "#eee", borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
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
function pillTone(kind) {
  switch (kind) {
    case "success": return { background: "#eaf8f0", border: "1px solid #d1fae5", color: "#065f46" };
    case "warn": return { background: "#fff7e6", border: "1px solid #ffd8a8", color: "#8a5a00" };
    case "danger": return { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" };
    case "muted": return { background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151" };
    default: return { background: "#fff", border: "1px solid #e5e7eb", color: "#111827" };
  }
}
