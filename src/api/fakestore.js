// src/api/fakestore.js
// ------------------------------------------------------------
// Minimal FakeStore API client + category utilities
// • Exposes: getAllProducts, getCategories, getProductsByCategory, getProduct
// • normalizeCategory(): tolerant in, canonical out
// • categoryLabel(): pretty labels for UI (Jewelery, Men's Clothing, etc.)
// ESLint-friendly: no empty catch, no unused vars.

const api = {
  async get(path) {
    const res = await fetch(`https://fakestoreapi.com${path}`);
    if (!res.ok) throw new Error(`FakeStore request failed: ${res.status}`);
    const data = await res.json();
    return { data };
  }
};

/**
 * normalizeCategory
 * Returns FakeStore canonical slugs:
 *   'all' | 'electronics' | 'jewelery' | "men's clothing" | "women's clothing"
 * - Decodes URL-encoded values
 * - Treats smart quotes as straight quotes
 * - Checks "women" before "men" to avoid wo*men* → men collisions
 */
export function normalizeCategory(input) {
  if (input == null) return 'all';

  let s = String(input);
  try {
    s = decodeURIComponent(s);
  } catch {
    // ignore malformed encodings; keep original string
    s = String(s);
  }

  s = s.replace(/\+/g, ' ');           // support ?cat=men%27s+clothing
  s = s.replace(/[’‘]/g, "'");         // curly → straight apostrophe

  const t = s.trim().toLowerCase();
  if (t === '' || /\ball\b/.test(t) || /\ball categories\b/.test(t)) return 'all';

  // IMPORTANT: check women before men; use word-ish boundaries
  if (/\bwomen(?:'s)?\b/.test(t) || /\bwomens\b/.test(t) || /women[-\s]clothing/.test(t)) {
    return "women's clothing";
  }
  if (/\bmen(?:'s)?\b/.test(t) || /\bmens\b/.test(t) || /men[-\s]clothing/.test(t)) {
    return "men's clothing";
  }

  if (/\belectronic/.test(t)) return 'electronics';

  // Accept both spellings; FakeStore uses 'jewelery'
  if (/\bjewel+e?ry\b/.test(t)) return 'jewelery';

  // Fallback safely
  return 'all';
}

/** Pretty labels for dropdowns / headers */
export function categoryLabel(cat) {
  const canonical = normalizeCategory(cat);
  const labels = {
    all: 'All Categories',
    electronics: 'Electronics',
    jewelery: 'Jewelery',
    "men's clothing": "Men's Clothing",
    "women's clothing": "Women's Clothing",
  };
  return labels[canonical] ?? canonical;
}

export async function getAllProducts() {
  const { data } = await api.get('/products');
  return data;
}

export async function getCategories() {
  const { data } = await api.get('/products/categories');
  return data;
}

export async function getProductsByCategory(category) {
  const canonical = normalizeCategory(category);
  if (canonical === 'all') return getAllProducts();
  const slug = encodeURIComponent(canonical);
  const { data } = await api.get(`/products/category/${slug}`);
  return data;
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}
