import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  listDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../services/discountService";
import { getCategories, categoryLabel } from "../services/productService";
import { Pagination } from "../components/Pagination";
import BreadcrumbNav from '../components/BreadcrumbNav';
import { useTotalHeaderHeight } from "../hooks/useTotalHeaderHeight";

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
  const { totalHeaderHeight } = useTotalHeaderHeight();
  const [codes, setCodes] = useState([]);
  const [draft, setDraft] = useState({ code: "", type: "percent", value: 10, active: true, category: "" });

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Fetch active categories
  const {
    data: categories = [],
    isLoading: loadingCategories,
  } = useQuery({
    queryKey: ["discount-categories"],
    queryFn: getCategories,
  });

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

  if (!user || user.role !== "admin") {
    return (
      <div className="container" style={{ padding: 24 }}>
        Access denied.
      </div>
    );
  }

  async function addCode(e) {
    e.preventDefault();
    const code = draft.code.trim().toUpperCase().replace(/\s/g, "");
    if (!code) return;
    try {
      await createDiscount({
        code,
        type: draft.type,
        value: Number(draft.value) || 0,
        active: !!draft.active,
        category: draft.category || null,
        uses: 0,
      });
      const data = await listDiscounts();
      setCodes(Array.isArray(data) ? data : []);
      setDraft({ code: "", type: "percent", value: 10, active: true, category: "" });
    } catch (err) {
      // TODO: handle error feedback (e.g. toast)
      console.error(err);
    }
  }

  async function handleActiveToggle(id, active) {
    try {
      await updateDiscount({ id, active });
      setCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active } : c))
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
    <>
      <BreadcrumbNav
        currentPage="Discounts"
        backButton={{ label: "Back to Dashboard", path: "/admin" }}
      />
      
      <div className="container-xl" style={{ paddingTop: totalHeaderHeight, paddingBottom: 24 }}>
        <div className="hero-headline" style={{ marginBottom: 8, marginTop: -8 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 0 }}>Admin</div>
            <h1 style={{ margin: 0 }}>Discounts</h1>
          </div>
        </div>

      <form className="card" style={{ padding: 12, marginBottom: 12 }} onSubmit={addCode}>
        <div className="hero-title-row">
          <h3 style={{ margin: 0 }}>New Discount</h3>
          <button className="btn btn-primary">Create</button>
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center" }}
        >
          <input
            className="input"
            placeholder="CODE"
            value={draft.code}
            onChange={(e) =>
              setDraft((d) => ({ ...d, code: e.target.value.toUpperCase().replace(/\s/g, "") }))
            }
          />
          <select
            className="select"
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
          >
            <option value="percent">% off</option>
            <option value="amount">$ off</option>
            <option value="shipping">Free shipping</option>
          </select>
          <input
            className="input"
            type="number"
            step="1"
            value={draft.value}
            onChange={(e) => setDraft((d) => ({ ...d, value: Number(e.target.value) }))}
          />
          <select
            className="select"
            value={draft.category || ""}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            disabled={loadingCategories}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabel(cat)}
              </option>
            ))}
          </select>
          <label className="checkbox" style={{ whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
            />{" "}
            Active
          </label>
        </div>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <>
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
            {paginatedCodes.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <Td>
                  <strong>{c.code}</strong>
                </Td>
                <Td>{c.type}</Td>
                <Td align="right">
                  {c.type === "percent"
                    ? `${c.value}%`
                    : c.type === "amount"
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
                <Td align="right">{c.uses ?? 0}</Td>
                <Td align="center">
                  <input
                    type="checkbox"
                    checked={!!c.active}
                    onChange={(e) => handleActiveToggle(c.id, e.target.checked)}
                  />
                </Td>
                <Td align="center">
                  <button 
                    className="btn btn-secondary btn-slim"
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
    </>
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
