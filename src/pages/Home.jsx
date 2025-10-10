// src/pages/Home.jsx
// ------------------------------------------------------------
// Home (Catalog) — URL is the single source of truth for category (?cat=...)
// • No mirrored local state → no effect loops → no white screen.
// • Search + Sort are local UI state; the product list derives from them.
// • Pagination for products (10 per page)
// ------------------------------------------------------------

import Hero from '../components/Hero.jsx'
import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listProducts, categoryLabel } from '../services/productService'
import ProductCard from '../components/ProductCard.jsx'
import { useSearchParams } from 'react-router-dom'
import { searchTiers } from '../utils/search.js'

const PRODUCTS_PER_PAGE = 10;

export default function Home() {
  // ───────────────────────────────────────────────────────────
  // Local UI inputs only. Catalog/category come
  // from URL and React Query to keep navigation reliable.
  // ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)

  // ───────────────────────────────────────────────────────────
  // URL → category (unknown → "all") and filter (deals, new, bestsellers)
  // ───────────────────────────────────────────────────────────
  const [params] = useSearchParams()
  const urlCategory = (params.get('cat') || 'all')
  const urlFilter = params.get('filter') || ''

  // Smooth scroll to top when category changes (nice on mobile)
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when category changes
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [urlCategory])


  // Reset page and scroll when filter changes (but not on initial load)
  useEffect(() => {
    // Only scroll if there's actually a filter active
    if (urlFilter) {
      setCurrentPage(1);
      requestAnimationFrame(() => {
        const element = document.getElementById('products-start');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }, [urlFilter])

  // ───────────────────────────────────────────────────────────
  // Fetch and cache the full catalog
  // ───────────────────────────────────────────────────────────
  const {
    data: allProducts = [],
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: listProducts,
  })


  // ───────────────────────────────────────────────────────────
  // Build tiers + apply sort and filters
  // ───────────────────────────────────────────────────────────
  const {
    primary,
    primarySorted,
  } = useMemo(() => {
    const tiers = searchTiers(allProducts, '', urlCategory === 'all' ? '' : urlCategory)

    // Apply special filters from nav bar
    const applyFilter = (list) => {
      if (!urlFilter) return list
      
      switch (urlFilter) {
        case 'deals':
          // Today's Deals: In-stock items sorted by price (showing best deals first)
          return list.filter(p => p.inventory > 0).sort((a, b) => a.price - b.price)
        
        case 'new':
          // New Releases: Highest rated items (simulating newest/best items)
          return list.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0))
        
        case 'bestsellers':
          // Best Sellers: Products with lower inventory (indicating high sales)
          // Filter out zero inventory and sort by inventory ascending
          return list.filter(p => p.inventory > 0).sort((a, b) => a.inventory - b.inventory)
        
        default:
          return list
      }
    }

    // Apply filter
    const filteredPrimary = applyFilter(tiers.primary)

    return {
      primary: filteredPrimary,
      primarySorted: filteredPrimary,
    }
  }, [allProducts, urlCategory, urlFilter])

  // ───────────────────────────────────────────────────────────
  // Presentation helpers
  // ───────────────────────────────────────────────────────────
  const label = urlCategory === 'all' ? 'All' : categoryLabel(urlCategory)
  const noPrimary = primary.length === 0
  
  // Filter label for display
  const getFilterLabel = () => {
    switch (urlFilter) {
      case 'deals': return "Today's Deals"
      case 'new': return 'New Releases'
      case 'bestsellers': return 'Best Sellers'
      default: return ''
    }
  }
  const filterLabel = getFilterLabel()

  // ───────────────────────────────────────────────────────────
  // Pagination for primary results
  // ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil(primarySorted.length / PRODUCTS_PER_PAGE);
  const paginatedPrimary = useMemo(() => {
    const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIdx = startIdx + PRODUCTS_PER_PAGE;
    return primarySorted.slice(startIdx, endIdx);
  }, [primarySorted, currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to products section
    document.getElementById('products-start')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <>
      <main className="container-xl" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Full-width within page container (matches AdminDashboard) */}
      <Hero activeCategory={urlCategory} />

      {/* Data states */}
      {isLoadingAll && <p>Loading products…</p>}
      {isErrorAll && <p>Could not load products.</p>}

      {/* ── Tier 1: in-category ──────────────────────────────── */}
      <section style={{ marginTop: 16 }}>
        <h2 style={{ margin: '8px 0 12px' }}>
          {filterLabel || (urlCategory === 'all' ? 'Products for you' : `Products in ${label}`)}
        </h2>

        <div id="products-start" />

        {!noPrimary && (
          <>
            <div className="grid products">
              {paginatedPrimary.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ minWidth: 100 }}
                >
                  ← Previous
                </button>
                
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        className="btn"
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          minWidth: 40,
                          padding: '8px 12px',
                          background: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                          color: currentPage === pageNum ? '#fff' : 'inherit',
                          border: '1px solid var(--border)',
                          fontWeight: currentPage === pageNum ? 700 : 400,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ minWidth: 100 }}
                >
                  Next →
                </button>
              </div>
            )}

            <div className="meta" style={{ textAlign: 'center', marginTop: 12 }}>
              Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1}-{Math.min(currentPage * PRODUCTS_PER_PAGE, primarySorted.length)} of {primarySorted.length} products
            </div>
          </>
        )}
      </section>

      </main>
    </>
  )
}
