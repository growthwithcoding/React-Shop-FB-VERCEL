// src/utils/search.js
// Smart search + ranking + tiering for FakeStore products.

/* ────────────────────────────────────────────────────────────
 * Synonyms / near-terms (extend as needed)
 * ──────────────────────────────────────────────────────────── */
const SYNONYMS = {
  shirt: ["shirts", "tshirt", "t-shirt", "tee", "tees", "top", "tops"],
  pant: ["pants", "trouser", "trousers"],
  jean: ["jeans", "denim"],
  shoe: ["shoes", "sneaker", "sneakers", "footwear", "boot", "boots"],
  jacket: ["coat", "outerwear", "hoodie", "sweatshirt"],
  men: ["mens", "men's", "male", "man", "guys"],
  women: ["womens", "women's", "ladies", "female", "girl", "girls", "woman"],
  jewelry: ["jewelery", "jewellery", "necklace", "ring", "earrings", "bracelet"],
  jewelery: ["jewelry", "jewellery", "necklace", "ring", "earrings", "bracelet"],
  electronic: ["electronics", "tech", "gadget", "device", "devices"],
};

/* ────────────────────────────────────────────────────────────
 * Normalization & token expansion
 * ──────────────────────────────────────────────────────────── */
export const normalize = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip diacritics
    .replace(/['’`]/g, "")             // Men’s -> mens
    .replace(/[&/|\\._-]+/g, " ")      // hyphens/underscores -> space
    .replace(/[^a-z0-9\s]+/g, " ")     // drop symbols
    .replace(/\s+/g, " ")
    .trim();

const pad = (s) => ` ${s} `;

const expandToken = (raw) => {
  const base = normalize(raw);
  const out = new Set([base]);

  // plural/singular
  if (base.endsWith("s")) out.add(base.slice(0, -1));
  else out.add(base + "s");

  // hyphen variants
  out.add(base.replace(/-/g, ""));
  out.add(base.replace(/-/g, " "));

  // synonyms
  (SYNONYMS[base] || []).forEach((s) => out.add(normalize(s)));
  return [...out].filter(Boolean);
};

/* ────────────────────────────────────────────────────────────
 * Indexing fields for matching
 * ──────────────────────────────────────────────────────────── */
const buildHaystacks = (p) => {
  const title = normalize(p?.title ?? "");
  const desc = normalize(p?.description ?? "");
  const cat  = normalize(p?.category ?? "");
  return { title, desc, cat, all: pad(`${title} ${desc} ${cat}`) };
};

const containsWholeWord = (hay, word) => hay.includes(` ${word} `);

const canonicalCat = (val = "") => (val);

/* ────────────────────────────────────────────────────────────
 * Relevance scoring (phrase > title > description > category > prefix)
 * ──────────────────────────────────────────────────────────── */
const scoreProduct = (p, query) => {
  if (!query) return 0;
  const q = normalize(query);
  const { title, desc, cat, all } = buildHaystacks(p);
  let score = 0;

  if (containsWholeWord(all, q)) score += 20;

  const tokens = q.split(" ").filter(Boolean);
  tokens.forEach((t) => {
    const variants = expandToken(t);
    variants.forEach((v) => {
      if (containsWholeWord(pad(title), v)) score += 8;
      if (containsWholeWord(pad(desc), v))  score += 5;
      if (containsWholeWord(pad(cat), v))   score += 4;
      if (v.length >= 3) {
        if (title.split(" ").some((w) => w.startsWith(v))) score += 3;
        if (desc.split(" ").some((w) => w.startsWith(v)))  score += 2;
      }
    });
  });

  return score;
};

/* ────────────────────────────────────────────────────────────
 * Core filter + rank (treat 'all' as no gate)
 * ──────────────────────────────────────────────────────────── */
export const filterAndRankProducts = (
  products = [],
  query = "",
  selectedCategory = ""
) => {
  let selected = selectedCategory ? canonicalCat(selectedCategory) : "";
  if (selected === "all") selected = ""; // 'all' means no gate

  const filtered = products.filter((p) => {
    if (selected && canonicalCat(p?.category) !== selected) return false;
    if (!query) return true;

    const { title, desc, cat, all } = buildHaystacks(p);
    const tokens = normalize(query).split(" ").filter(Boolean);

    return tokens.every((t) => {
      const variants = expandToken(t);
      return variants.some(
        (v) =>
          containsWholeWord(all, v) ||
          (v.length >= 3 &&
            (title.split(" ").some((w) => w.startsWith(v)) ||
             desc.split(" ").some((w) => w.startsWith(v)) ||
             cat.split(" ").some((w) => w.startsWith(v))))
      );
    });
  });

  if (!query) return filtered; // keep API order when no query
  return [...filtered].sort((a, b) => scoreProduct(b, query) - scoreProduct(a, query));
};

/* ────────────────────────────────────────────────────────────
 * Tiered results (no duplicates between tiers)
 * ──────────────────────────────────────────────────────────── */

// Top-rated fallback
const byTopRating = (a, b) => {
  const ar = a?.rating?.rate ?? 0;
  const br = b?.rating?.rate ?? 0;
  const ac = a?.rating?.count ?? 0;
  const bc = b?.rating?.count ?? 0;
  return br - ar || bc - ac;
};

/**
 * Build three tiers of results for the UI:
 * - primary:     query constrained to selected category ('' = all)
 * - global:      query across all categories (only when primary is empty)
 * - suggestions: items NOT shown in primary or global; fallback = top-rated
 */
export const searchTiers = (
  products = [],
  query = "",
  selectedCategory = ""
) => {
  const q = (query ?? "").trim();

  // Tier 1 — in selected category (treat 'all' as no gate)
  const selected = selectedCategory === "all" ? "" : selectedCategory;
  const primary = filterAndRankProducts(products, q, selected);

  // If no query, keep the homepage quiet (only Tier 1)
  if (!q) return { primary, global: [], suggestions: [] };

  // Tier 2 — global only when Tier 1 is empty
  const global = primary.length === 0 ? filterAndRankProducts(products, q, "") : [];

  // Tier 3 — suggestions: exclude everything already shown above
  const shown = new Set([...primary, ...global].map((p) => p.id));
  const suggestions = products
    .filter((p) => !shown.has(p.id))
    .sort(byTopRating)
    .slice(0, 12);

  return { primary, global, suggestions };
};
