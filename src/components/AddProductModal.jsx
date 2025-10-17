import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { createProduct, updateProduct, deleteProduct } from "../services/productService";
import { listCategories, createCategory, getCategoriesFromProducts } from "../services/categoryService";

function asNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function AddProductModal({ open, mode = "create", initial, onClose, onSuccess }) {
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";

  const [draft, setDraft] = useState({
    title: "",
    price: 0,
    image: "",
    shortDescription: "",
    longDescription: "",
    category: "general",
    sku: "",
    inventory: 0,
    status: "active",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);

  // Load categories when modal opens
  useEffect(() => {
    if (!open) return;
    setErr("");
    setBusy(false);
    
    async function loadCategories() {
      try {
        let cats = await listCategories();
        // If no categories in DB, get from products
        if (cats.length === 0) {
          cats = await getCategoriesFromProducts();
        }
        // Add "general" if not present
        if (!cats.find(c => c.name === "general")) {
          cats = [{ name: "general" }, ...cats];
        }
        setCategories(cats);
      } catch (e) {
        console.error("Failed to load categories:", e);
        setCategories([{ name: "general" }]);
      }
    }
    
    loadCategories();
    
    if (isEdit && initial) {
      setDraft({
        title: initial.title || "",
        price: asNumber(initial.price, 0),
        image: initial.image || "",
        shortDescription: initial.shortDescription || "",
        longDescription: initial.longDescription || "",
        category: initial.category || "general",
        sku: initial.sku || "",
        inventory: asNumber(initial.inventory, 0),
        status: initial.status || (asNumber(initial.inventory, 0) > 0 ? "active" : "inactive"),
      });
    } else if (isCreate) {
      setDraft({ title: "", price: 0, image: "", shortDescription: "", longDescription: "", category: "general", sku: "", inventory: 0, status: "active" });
    }
  }, [open, isCreate, isEdit, initial]);

  if (!open) return null;

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (isDelete) return;
    if (!draft.title.trim()) return setErr("Title is required.");
    if (draft.price < 0) return setErr("Price cannot be negative.");
    if (draft.inventory < 0) return setErr("Inventory cannot be negative.");
    try {
      setBusy(true);
      if (isCreate) {
        await createProduct(draft);
      }
      if (isEdit) {
        await updateProduct(initial.id, draft);
      }
      onSuccess?.();
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
      await deleteProduct(initial.id);
      onSuccess?.();
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Failed to delete product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div className="hero-title-row" style={{ alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>
            {isCreate && "Add Product"}
            {isEdit && "Edit Product"}
            {isDelete && "Delete Product"}
          </h3>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {isDelete ? (
          <>
            <p>Are you sure you want to delete <strong>{initial?.title || "this product"}</strong>?</p>
            {err && <div className="card" style={{ padding: 8, color: "var(--danger, #991b1b)" }}>{err}</div>}
            <div className="actions">
              <button
                onClick={onClose}
                disabled={busy}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: busy ? "#9ca3af" : "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "#b91c1c"; }}
                onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = "#dc2626"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Title</div>
                <input className="input" value={draft.title} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Product title" style={{ padding: "6px 10px", fontSize: "13px" }} />
              </label>
              <label className="field">
                <div className="meta">Price</div>
                <input className="input" type="number" min="0" step="0.01" value={draft.price}
                  onChange={(e) => setDraft(d => ({ ...d, price: asNumber(e.target.value, 0) }))} style={{ padding: "6px 10px", fontSize: "13px" }} />
              </label>
              <label className="field">
                <div className="meta">Inventory</div>
                <input className="input" type="number" min="0" step="1" value={draft.inventory}
                  onChange={(e) => setDraft(d => ({ ...d, inventory: Math.max(0, Math.floor(asNumber(e.target.value, 0))) }))} style={{ padding: "6px 10px", fontSize: "13px" }} />
              </label>
              <label className="field">
                <div className="meta">SKU</div>
                <input className="input" value={draft.sku} onChange={(e) => setDraft(d => ({ ...d, sku: e.target.value }))} placeholder="SKU-1234" style={{ padding: "6px 10px", fontSize: "13px" }} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Image URL</div>
                <input className="input" value={draft.image} onChange={(e) => setDraft(d => ({ ...d, image: e.target.value }))} placeholder="https://…" style={{ padding: "6px 10px", fontSize: "13px" }} />
              </label>
              <div className="field">
                <div className="meta">Category</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <select 
                    className="select" 
                    value={draft.category} 
                    onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
                    style={{ flex: 1, padding: "6px 10px", fontSize: "13px" }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    disabled={categoryBusy}
                    style={{ 
                      padding: "6px 12px", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 4,
                      background: categoryBusy ? "#9ca3af" : "#067D62",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: categoryBusy ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!categoryBusy) {
                        e.currentTarget.style.background = "#055A4A";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!categoryBusy) {
                        e.currentTarget.style.background = "#067D62";
                      }
                    }}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                {showAddCategory && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <input
                      className="input"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      style={{ flex: 1, padding: "6px 10px", fontSize: "13px" }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCategoryName.trim()) return;
                        try {
                          setCategoryBusy(true);
                          await createCategory({ name: newCategoryName.trim() });
                          // Reload categories
                          const cats = await listCategories();
                          setCategories(cats);
                          setDraft(d => ({ ...d, category: newCategoryName.trim() }));
                          setNewCategoryName("");
                          setShowAddCategory(false);
                        } catch (e) {
                          setErr(e?.message || "Failed to create category");
                        } finally {
                          setCategoryBusy(false);
                        }
                      }}
                      disabled={categoryBusy || !newCategoryName.trim()}
                      style={{ 
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        background: categoryBusy || !newCategoryName.trim() ? "#9ca3af" : "#067D62",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: categoryBusy || !newCategoryName.trim() ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!categoryBusy && newCategoryName.trim()) {
                          e.currentTarget.style.background = "#055A4A";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!categoryBusy && newCategoryName.trim()) {
                          e.currentTarget.style.background = "#067D62";
                        }
                      }}
                    >
                      {categoryBusy ? "Creating…" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName("");
                      }}
                      disabled={categoryBusy}
                      style={{ 
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <label className="field">
                <div className="meta">Status</div>
                <select className="select" value={draft.status} onChange={(e) => setDraft(d => ({ ...d, status: e.target.value }))} style={{ padding: "6px 10px", fontSize: "13px" }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Short Description</div>
                <textarea className="input" rows={2} value={draft.shortDescription}
                  onChange={(e) => setDraft(d => ({ ...d, shortDescription: e.target.value }))} 
                  placeholder="Brief product summary (shown on product cards)"
                  style={{ padding: "6px 10px", fontSize: "13px" }} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="meta">Long Description</div>
                <textarea className="input" rows={6} value={draft.longDescription}
                  onChange={(e) => setDraft(d => ({ ...d, longDescription: e.target.value }))} 
                  placeholder="Detailed product description (shown on product page)"
                  style={{ padding: "6px 10px", fontSize: "13px" }} />
              </label>
            </div>

            {err && <div className="card" style={{ padding: 8, marginTop: 8, color: "var(--danger, #991b1b)" }}>{err}</div>}

            <div className="actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: busy ? "#9ca3af" : "#067D62",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "#055A4A"; }}
                onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = "#067D62"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                {busy ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save" : "Create")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
