// src/pages/Home.jsx
// ------------------------------------------------------------
// Home (Catalog) — URL is the single source of truth for category (?cat=...)
// • No mirrored local state → no effect loops → no white screen.
// • Search + Sort are local UI state; the product list derives from them.
// ------------------------------------------------------------

import Hero from '../components/Hero.jsx'
import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllProducts, normalizeCategory, categoryLabel } from '../api/fakestore.js'
import CategorySelect from '../components/CategorySelect.jsx'
import ProductCard from '../components/ProductCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SortControl from '../components/SortControl.jsx'
import { useSearchParams } from 'react-router-dom'
import { searchTiers } from '../utils/search.js'

export default function Home() {
  // ───────────────────────────────────────────────────────────
  // Local UI inputs only (search, sort). Catalog/category come
  // from URL and React Query to keep navigation reliable.
  // ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('relevance')

  // ───────────────────────────────────────────────────────────
  // URL → category. Canonicalize for consistent behavior (e.g.,
  // "Men’s clothing" -> "men's clothing"). Unknown → "all".
  // ───────────────────────────────────────────────────────────
  const [params, setParams] = useSearchParams()
  const urlCategory = normalizeCategory(params.get('cat') || 'all')

  // Smooth scroll to top when category changes (nice on mobile)
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [urlCategory])

  // Category selector writes to URL (single source of truth).
  const onChangeCategory = (nextValue) => {
    const next = normalizeCategory(nextValue) || 'all'
    const qp = new URLSearchParams(params)
    if (next === 'all') {
      if (qp.has('cat')) {
        qp.delete('cat')
        setParams(qp, { replace: true })
      }
    } else if (qp.get('cat') !== next) {
      qp.set('cat', next)
      setParams(qp, { replace: true })
    }
  }

  // ───────────────────────────────────────────────────────────
  // Fetch and cache the full catalog; tiered search works off a
  // single stable dataset (simple + fast fallbacks).
  // ───────────────────────────────────────────────────────────
  const {
    data: allProducts = [],
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: getAllProducts,
  })

  // Treat "all" as no category gate ('') for the tiered search.
  const selectedForSearch = urlCategory === 'all' ? '' : urlCategory

  // ───────────────────────────────────────────────────────────
  // Build tiers and apply user-selected sort in one memo:
  // - Tier 1: primary (in-category)
  // - Tier 2: global (all categories) [only when Tier 1 is empty]
  // - Tier 3: suggestions (non-duplicates) [always excludes Tier 1 & 2]
  // Sorting preserves "relevance" when chosen, otherwise sorts on a copy.
  // ───────────────────────────────────────────────────────────
  const {
    primary,
    primarySorted,
    globalSorted,
    suggestionsSorted,
  } = useMemo(() => {
    const tiers = searchTiers(allProducts, search, selectedForSearch)

    const sortFn = (list) => {
      const out = list.slice()
      switch (sort) {
        case 'price-asc':   out.sort((a, b) => a.price - b.price); break
        case 'price-desc':  out.sort((a, b) => b.price - a.price); break
        case 'rating-desc': out.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0)); break
        case 'title-asc':   out.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break
        default:            /* relevance → keep tier’s own ranking */ break
      }
      return out
    }

    // Tier-2 is only meaningful when Tier-1 is empty (per spec)
    const globalList = tiers.primary.length === 0 ? tiers.global : []

    return {
      primary: tiers.primary,
      primarySorted: sortFn(tiers.primary),
      globalSorted: sortFn(globalList),
      suggestionsSorted: sortFn(tiers.suggestions),
    }
  }, [allProducts, search, selectedForSearch, sort])

  // ───────────────────────────────────────────────────────────
  // Presentation helpers for headings/sections
  // ───────────────────────────────────────────────────────────
  const hasSearch = search.trim().length > 0
  const label = urlCategory === 'all' ? 'All' : categoryLabel(urlCategory)
  const noPrimary = hasSearch && primary.length === 0
  const noGlobal = hasSearch && noPrimary && globalSorted.length === 0

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div className="container">
      <Hero activeCategory={urlCategory} />

      {/* Filter Bar */}
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <SearchBar value={search} onChange={setSearch} />
          <CategorySelect value={urlCategory} onChange={onChangeCategory} />
          <SortControl value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Data states */}
      {isLoadingAll && <p>Loading products…</p>}
      {isErrorAll && <p>Could not load products.</p>}

      {/* ── Tier 1: in-category ──────────────────────────────── */}
      <section style={{ marginTop: 16 }}>
        <h2 style={{ margin: '8px 0 12px' }}>
          {hasSearch
            ? (noPrimary
                ? <>No results in {label} for “{search}”</>
                : <>“{search}” — Results in {label}</>)
            : (urlCategory === 'all'
                ? 'Products for you'
                : `Products in ${label}`)}
        </h2>

        <div id="products-start" />

        <div className="grid products">
          {!noPrimary && primarySorted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── Tier 2: global (shown only when Tier-1 had none) ─── */}
      {hasSearch && noPrimary && (
        <section style={{ marginTop: 28 }}>
          <h3>Results in all categories</h3>

          {/* If there are none globally, say so explicitly */}
          {noGlobal && (
            <p style={{ margin: '6px 0 12px' }}>
              No results in all categories for “{search}”.
            </p>
          )}

          <div className="grid products">
            {globalSorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Tier 3: suggestions (always excludes anything shown above) ── */}
      {hasSearch && noPrimary && suggestionsSorted.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h3>You might also like</h3>
          <div className="grid products">
            {suggestionsSorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
