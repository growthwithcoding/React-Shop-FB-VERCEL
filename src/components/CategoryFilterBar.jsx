// src/components/CategoryFilterBar.jsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCategories, categoryLabel, listProducts } from '../services/productService';
import { useMemo } from 'react';
import { Grid3x3 } from 'lucide-react';

/**
 * CategoryFilterBar - Quick category switcher
 * Horizontal scrollable chips for fast category navigation
 */
export default function CategoryFilterBar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const activeCategory = params.get('category') || params.get('cat') || 'all';

  // Fetch categories and products for counts
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: listProducts,
  });

  // Calculate product counts per category
  const categoryCounts = useMemo(() => {
    if (!products.length) return {};
    
    const counts = { all: products.filter(p => p.status === 'active').length };
    
    categories.forEach(cat => {
      counts[cat] = products.filter(
        p => p.category === cat && p.status === 'active'
      ).length;
    });
    
    return counts;
  }, [categories, products]);

  const handleCategoryClick = (category) => {
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
  };

  const isLoading = loadingCategories || loadingProducts;

  if (isLoading) {
    return (
      <div className="category-filter-bar">
        <div className="filter-chips-wrapper">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="filter-chip-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="category-filter-bar">
      <div className="filter-chips-wrapper">
        {/* All Categories Chip */}
        <button
          className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleCategoryClick('all')}
        >
          <Grid3x3 size={16} />
          <span>All</span>
          {categoryCounts.all > 0 && (
            <span className="chip-count">{categoryCounts.all}</span>
          )}
        </button>

        {/* Category Chips */}
        {categories.map((cat) => {
          const count = categoryCounts[cat] || 0;
          
          return (
            <button
              key={cat}
              className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              <span>{categoryLabel(cat)}</span>
              {count > 0 && <span className="chip-count">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
