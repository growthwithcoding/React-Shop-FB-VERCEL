import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  listDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../services/discountService";
import { categoryLabel } from "../services/productService";
import { Pagination } from "../components/Pagination";
import CreateDiscountModal from "../components/CreateDiscountModal";
import { Plus } from "lucide-react";

// Helper formatter for amount discounts
const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Admin UI for managing discount codes.
 * Codes are loaded from Firestore; admins can create codes and toggle active status.
 */
export function AdminDiscounts() {
  const { user } = useAuth();
  const [codes, setCodes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Paginated codes
  const paginatedCodes = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return codes.slice(start, end);
  }, [codes, page, perPage]);

  const totalPages = Math.ceil(codes.length / perPage);

  // Load discount codes on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listDiscounts();
        if (!alive) return;
        setCodes(Array.isArray(data) ? data : []);
      } catch {
        // ignore errors for now
      }
    })();
    return () => { alive = false; };
  }, []);

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

  if (!user || user.role !== "admin") {
    return (
      <div className="container" style={{ padding: 24 }}>
        Access denied.
      </div>
    );
  }

  async function handleCreateDiscount(discountData) {
    try {
      await createDiscount(discountData);
      const data = await listDiscounts();
      setCodes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async function handleActiveToggle(id, isActive) {
    try {
      await updateDiscount({ id, isActive });
      setCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive } : c))
      );
    } catch (err) {
      // TODO: handle error feedback
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this discount code?")) return;
    try {
      await deleteDiscount(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete discount code");
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
      <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Hero Headline with Title, Description, and Actions */}
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker">Admin</div>
            <h1 style={{ margin: 0 }}>Discounts</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Manage discount codes and promotional offers
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
              onClick={() => setShowCreateModal(true)}
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
              <Plus size={14} />
              Create Discount
            </button>
          </div>
        </div>

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
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: amazonColors.darkBg, minWidth: "140px" }}>Discount Codes</h2>
                
                {/* Filters Placeholder - Centered */}
                <div style={{ flex: 1, maxWidth: "500px", display: "flex", justifyContent: "center" }}>
                  <input 
                    className="input" 
                    placeholder="Search discount codes..." 
                    style={{ fontSize: "13px", padding: "6px 10px", width: "100%" }}
                  />
                </div>
                
                {/* Stats */}
                <div style={{ minWidth: "200px", textAlign: "right" }}>
                  <div style={{ fontSize: "13px", color: "#718096", fontWeight: 600 }}>
                    {codes.length} discount{codes.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <Th>Code</Th>
              <Th>Type</Th>
              <Th align="right">Value</Th>
              <Th>Category</Th>
              <Th align="right">Uses</Th>
              <Th align="center">Active</Th>
              <Th align="center">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {paginatedCodes.map((c, index) => (
              <tr key={c.id} style={{ 
                borderBottom: "1px solid var(--border)",
                background: index % 2 === 0 ? "#fff" : "#f9fafb"
              }}>
                <Td>
                  <strong>{c.code}</strong>
                </Td>
                <Td>
                  {c.type === "percentage" && "% off"}
                  {c.type === "fixed" && "$ off"}
                  {c.type === "free_shipping" && "Free shipping"}
                  {!["percentage", "fixed", "free_shipping"].includes(c.type) && c.type}
                </Td>
                <Td align="right">
                  {c.type === "percentage"
                    ? `${c.value}%`
                    : c.type === "fixed"
                    ? USD.format(c.value)
                    : "—"}
                </Td>
                <Td>
                  {c.category ? (
                    <span className="pill" style={{ fontSize: 11 }}>
                      {categoryLabel(c.category)}
                    </span>
                  ) : (
                    <span className="meta">All</span>
                  )}
                </Td>
                <Td align="right">{c.usageCount ?? c.uses ?? 0}</Td>
                <Td align="center">
                  <input
                    type="checkbox"
                    checked={!!c.isActive}
                    onChange={(e) => handleActiveToggle(c.id, e.target.checked)}
                  />
                </Td>
                <Td align="center" style={{ whiteSpace: "nowrap" }}>
                  <button 
                    style={{
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
                    onClick={() => handleDelete(c.id)}
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
              {!paginatedCodes.length && (
                <tr>
                  <Td colSpan={7} align="center" style={{ padding: 20, color: "var(--muted)" }}>
                    No discounts found
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
                  totalItems={codes.length}
                  itemsPerPage={perPage}
                  onItemsPerPageChange={(newPerPage) => {
                    setPerPage(newPerPage);
                    setPage(1);
                  }}
                />
              )}
            </>
        </div>
      </div>
      
      {/* Discount Creation Modal */}
      <CreateDiscountModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateDiscount}
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
