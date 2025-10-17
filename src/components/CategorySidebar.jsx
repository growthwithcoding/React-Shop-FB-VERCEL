// src/components/CategorySidebar.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCategories, categoryLabel } from '../services/productService';
import { Menu, X, ChevronRight, Grid3x3 } from 'lucide-react';

/**
 * CategorySidebar - Amazon-inspired category navigation
 * - Sticky sidebar on desktop
 * - Slide-in menu on mobile
 * - Highlights active category
 */
export default function CategorySidebar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const activeCategory = params.get('category') || params.get('cat') || 'all';
  
  // Mobile menu state
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Close mobile menu when clicking outside or on category
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCategorySelect = (category) => {
    const newParams = new URLSearchParams(params);
    
    if (category === 'all') {
      newParams.delete('category');
      newParams.delete('cat');
    } else {
      newParams.set('category', category);
    }
    
    // Clear search query when switching categories
    newParams.delete('q');
    
    navigate(newParams.toString() ? `/?${newParams.toString()}` : '/');
    setIsOpen(false); // Close mobile menu after selection
  };

  const sidebarContent = (
    <nav className="category-sidebar-nav">
      {/* All Categories */}
      <button
        className={`category-item ${activeCategory === 'all' ? 'active' : ''}`}
        onClick={() => handleCategorySelect('all')}
      >
        <Grid3x3 size={18} />
        <span>All Categories</span>
        {activeCategory === 'all' && <ChevronRight size={16} className="ml-auto" />}
      </button>

      <div className="category-divider" />

      {/* Category List */}
      {isLoading ? (
        <div className="category-loading">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="category-skeleton" />
          ))}
        </div>
      ) : (
        categories.map((cat) => (
          <button
            key={cat}
            className={`category-item ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => handleCategorySelect(cat)}
          >
            <span>{categoryLabel(cat)}</span>
            {activeCategory === cat && <ChevronRight size={16} className="ml-auto" />}
          </button>
        ))
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="mobile-category-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Open categories menu"
      >
        <Menu size={24} />
        <span>Categories</span>
      </button>

      {/* Desktop Sidebar */}
      <aside className="category-sidebar desktop-sidebar">
        <div className="sidebar-header">
          <h3>Shop by Category</h3>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Slide-in) */}
      {isOpen && (
        <>
          <div 
            className="mobile-sidebar-overlay" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside className="category-sidebar mobile-sidebar">
            <div className="sidebar-header">
              <h3>Categories</h3>
              <button 
                onClick={() => setIsOpen(false)}
                aria-label="Close categories menu"
                className="close-btn"
              >
                <X size={24} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
