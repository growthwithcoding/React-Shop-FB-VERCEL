// src/components/CategoryBreadcrumbs.jsx
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { categoryLabel } from '../services/productService';

/**
 * CategoryBreadcrumbs - Navigation breadcrumb trail
 * Shows: Home > Category (when category is selected)
 * Shows: Home > Category > Product (when on product page)
 */
export default function CategoryBreadcrumbs({ currentCategory, category, productName }) {
  // Use either currentCategory or category prop
  const activeCat = currentCategory || category;

  return (
    <nav className="category-breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {/* Home link */}
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <Home size={16} />
            <span>Home</span>
          </Link>
        </li>
        
        {/* Category link (if category exists) */}
        {activeCat && activeCat !== 'all' && (
          <>
            <li className="breadcrumb-separator" aria-hidden="true">
              <ChevronRight size={16} />
            </li>
            <li className="breadcrumb-item">
              {productName ? (
                <Link to={`/?category=${activeCat}`} className="breadcrumb-link">
                  <span>{categoryLabel(activeCat)}</span>
                </Link>
              ) : (
                <span className="breadcrumb-current">
                  {categoryLabel(activeCat)}
                </span>
              )}
            </li>
          </>
        )}
        
        {/* Product name (if on product page) */}
        {productName && (
          <>
            <li className="breadcrumb-separator" aria-hidden="true">
              <ChevronRight size={16} />
            </li>
            <li className="breadcrumb-item active">
              <span className="breadcrumb-current">
                {productName}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
