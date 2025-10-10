// src/components/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Amazon-inspired pagination component
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Items shown per page
 * @param {function} onItemsPerPageChange - Callback when items per page changes
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderTop: '1px solid var(--border)',
      background: '#fafafa',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      {/* Left: Items per page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          style={{
            padding: '6px 10px',
            border: '1px solid #d5d9d9',
            borderRadius: '8px',
            background: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        <span style={{ fontSize: '13px', color: '#565959' }}>
          {startItem}-{endItem} of {totalItems}
        </span>
      </div>

      {/* Center: Page numbers */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            border: '1px solid #d5d9d9',
            borderRadius: '6px',
            background: currentPage === 1 ? '#f7f8f8' : '#fff',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, idx) => (
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              style={{
                padding: '6px 8px',
                color: '#565959',
                fontSize: '14px',
              }}
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 8px',
                border: '1px solid #d5d9d9',
                borderRadius: '6px',
                background: page === currentPage ? '#febd69' : '#fff',
                color: page === currentPage ? '#0f1111' : '#0f1111',
                fontSize: '13px',
                fontWeight: page === currentPage ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (page !== currentPage) {
                  e.currentTarget.style.background = '#f7f8f8';
                  e.currentTarget.style.borderColor = '#bbb';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== currentPage) {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#d5d9d9';
                }
              }}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            border: '1px solid #d5d9d9',
            borderRadius: '6px',
            background: currentPage === totalPages ? '#f7f8f8' : '#fff',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
          }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Right: Page info */}
      <div style={{ fontSize: '13px', color: '#565959', whiteSpace: 'nowrap' }}>
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
