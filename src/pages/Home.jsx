// src/pages/Home.jsx
// ------------------------------------------------------------
// Home (Catalog) — URL is the single source of truth for category (?cat=...)
// • No mirrored local state → no effect loops → no white screen.
// • Search + Sort are local UI state; the product list derives from them.
// • Pagination for products (10 per page)
// ------------------------------------------------------------

import Hero from '../components/Hero.jsx'
import CategorySidebar from '../components/CategorySidebar.jsx'
import CategoryGrid from '../components/CategoryGrid.jsx'
import CategoryBreadcrumbs from '../components/CategoryBreadcrumbs.jsx'
import CategoryFilterBar from '../components/CategoryFilterBar.jsx'
import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listProducts, categoryLabel } from '../services/productService'
import ProductCard from '../components/ProductCard.jsx'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { searchTiers } from '../utils/search.js'

const PRODUCTS_PER_PAGE = 10;

export default function Home() {
  // ───────────────────────────────────────────────────────────
  // Local UI inputs only. Catalog/category come
  // from URL and React Query to keep navigation reliable.
  // ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)

  // ───────────────────────────────────────────────────────────
  // URL → category, filter, and search query
  // ───────────────────────────────────────────────────────────
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const urlCategory = params.get('category') || params.get('cat') || 'all'  // Support both for backward compatibility
  const urlFilter = params.get('filter') || ''
  const urlQuery = params.get('q') || ''  // FIX: Read search query from URL

  // Smooth scroll to top when category or search changes
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when category or search changes
    requestAnimationFrame(() => {
      // Scroll to top of page to show breadcrumbs
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [urlCategory, urlQuery])


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
    // CRITICAL: Filter out inactive products first - only show active products on storefront
    const activeProducts = allProducts.filter(p => p.status === 'active')
    
    // FIX: Pass actual search query instead of empty string
    const tiers = searchTiers(activeProducts, urlQuery, urlCategory === 'all' ? '' : urlCategory)

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
  }, [allProducts, urlCategory, urlFilter, urlQuery])  // FIX: Add urlQuery to dependencies

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

  // Helper for clearing search
  const handleClearSearch = () => {
    const newParams = new URLSearchParams(params);
    newParams.delete('q');
    navigate(newParams.toString() ? `/?${newParams.toString()}` : '/');
  };

  const isSearching = isLoadingAll && urlQuery;

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div className="home-page-wrapper">
      {/* Category Sidebar (Desktop: sticky, Mobile: slide-in) */}
      <CategorySidebar />

      {/* Main Content Area */}
      <main className="home-main-content">
        <div className="container-xl" style={{ paddingTop: 16, paddingBottom: 24 }}>
          {/* Breadcrumbs and Filter Bar Row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            paddingTop: '8px'
          }}>
            {/* Category Breadcrumbs - Left */}
            <CategoryBreadcrumbs currentCategory={urlCategory} />
            
            {/* Category Filter Bar - Right */}
            {!urlQuery && (
              <div style={{ marginLeft: 'auto' }}>
                <CategoryFilterBar />
              </div>
            )}
          </div>
          
          {/* Hero Section */}
          <Hero activeCategory={urlCategory} />

          {/* Category Grid - Only show on "all" view when not searching */}
          {urlCategory === 'all' && !urlQuery && (
            <CategoryGrid />
          )}

      {/* Data states */}
      {isLoadingAll && <p>{isSearching ? `Searching for "${urlQuery}"...` : 'Loading products…'}</p>}
      {isErrorAll && <p>Could not load products.</p>}

          {/* Search feedback banner */}
          {urlQuery && !isLoadingAll && (
        <div style={{ 
          padding: '12px 16px',
          background: '#f0f8ff',
          border: '1px solid #0066cc',
          borderRadius: '8px',
          marginTop: '16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <strong style={{ color: '#0066cc' }}>Search results for: "{urlQuery}"</strong>
            {urlCategory !== 'all' && <span style={{ marginLeft: '8px', color: '#666' }}>in {label}</span>}
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Found {primarySorted.length} product{primarySorted.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleClearSearch}
            style={{ whiteSpace: 'nowrap' }}
          >
            ✕ Clear Search
          </button>
          </div>
          )}

          {/* ── Tier 1: in-category ──────────────────────────────── */}
          <section style={{ marginTop: 16 }}>
        <h2 style={{ margin: '8px 0 12px' }}>
          {urlQuery ? `Search Results` : (filterLabel || 'Products')}
        </h2>

        <div id="products-start" />

        {!noPrimary && !isLoadingAll && (
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

        {/* Empty state - No results found */}
        {noPrimary && !isLoadingAll && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '8px', color: '#333' }}>No products found</h3>
            {urlQuery ? (
              <>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  We couldn't find any products matching <strong>"{urlQuery}"</strong>
                  {urlCategory !== 'all' && ` in ${label}`}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/')}
                  >
                    Browse All Products
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleClearSearch}
                  >
                    Clear Search
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: '#666' }}>
                No products available in this category
              </p>
            )}
            </div>
          )}
          </section>
        </div>
      </main>
    </div>
  )
}
