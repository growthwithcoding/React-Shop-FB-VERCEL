// CategorySearchBar.jsx
// Enhanced search bar with dynamic category dropdown from Firestore
import { useState, useEffect, useRef } from 'react';
import { listCategories } from '../services/categoryService';

/**
 * @param {Object} props
 * @param {string} props.value - Search query value
 * @param {(value: string) => void} props.onChange - Search query change handler
 * @param {string} [props.selectedCategory='all'] - Selected category
 * @param {(category: string) => void} [props.onCategoryChange] - Category change handler
 * @param {string} [props.placeholder='Search products…']
 */
export default function CategorySearchBar({
  value,
  onChange,
  selectedCategory = 'all',
  onCategoryChange,
  placeholder = 'Search products…'
}) {
  const [categories, setCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Fetch categories from Firestore
  useEffect(() => {
    let isMounted = true;
    
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const cats = await listCategories();
        
        // If no categories found, try getting from products
        if ((!cats || cats.length === 0) && isMounted) {
          console.log('No categories collection found, fetching from products...');
          const { getCategoriesFromProducts } = await import('../services/categoryService');
          const productCats = await getCategoriesFromProducts();
          if (isMounted && productCats) {
            setCategories(productCats);
          }
        } else if (isMounted) {
          setCategories(cats);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Try fallback to products
        try {
          const { getCategoriesFromProducts } = await import('../services/categoryService');
          const productCats = await getCategoriesFromProducts();
          if (isMounted && productCats) {
            setCategories(productCats);
          }
        } catch (fallbackError) {
          console.error('Fallback category fetch also failed:', fallbackError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Handle keyboard navigation in dropdown
  const handleDropdownKeyDown = (e) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false);
      buttonRef.current?.focus();
    }
  };

  const handleCategorySelect = (categoryId) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
    setDropdownOpen(false);
    buttonRef.current?.focus();
  };

  const handleClearSearch = () => {
    onChange('');
  };

  const selectedCategoryName = selectedCategory === 'all' 
    ? 'All'
    : categories.find(c => c.id === selectedCategory)?.name || 'All';

  return (
    <div className="category-search-wrapper">
      {/* Category Dropdown Button */}
      <div className="category-dropdown-container">
        <button
          ref={buttonRef}
          type="button"
          className="category-dropdown-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setDropdownOpen(!dropdownOpen);
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          aria-label={`Category filter, currently ${selectedCategoryName}`}
        >
          <span className="category-dropdown-text">{selectedCategoryName}</span>
          <span className="category-dropdown-caret" aria-hidden="true">▾</span>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div 
            ref={dropdownRef}
            className="category-dropdown-menu"
            role="listbox"
            aria-label="Product categories"
            onKeyDown={handleDropdownKeyDown}
          >
            <button
              type="button"
              role="option"
              aria-selected={selectedCategory === 'all'}
              className={`category-dropdown-item ${selectedCategory === 'all' ? 'selected' : ''}`}
              onClick={() => handleCategorySelect('all')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCategorySelect('all');
                }
              }}
            >
              All Departments
            </button>
            
            {loading ? (
              <div className="category-dropdown-item loading">
                Loading categories...
              </div>
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="option"
                  aria-selected={selectedCategory === cat.id}
                  className={`category-dropdown-item ${selectedCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(cat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCategorySelect(cat.id);
                    }
                  }}
                >
                  {cat.name}
                </button>
              ))
            ) : (
              <div className="category-dropdown-item no-categories">
                No categories available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="category-search-input-wrapper">
        <label htmlFor="category-search-input" className="sr-only">
          Search products
        </label>
        <input
          id="category-search-input"
          type="search"
          className="category-search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search products"
          autoComplete="off"
          spellCheck={false}
        />
        
        {/* Clear button - only show when there's text */}
        {value && (
          <button
            type="button"
            className="category-search-clear"
            onClick={handleClearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Search Submit Button */}
      <button
        type="submit"
        className="category-search-submit"
        aria-label="Submit search"
        title="Search"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
          strokeLinecap="round" 
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
    </div>
  );
}
