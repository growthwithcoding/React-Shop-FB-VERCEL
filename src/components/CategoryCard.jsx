// src/components/CategoryCard.jsx
import { Link } from 'react-router-dom';
import { categoryLabel } from '../services/productService';
import { ChevronRight } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

/**
 * CategoryCard - Individual category card for the grid
 * Shows category image, name, and product count
 */
export default function CategoryCard({ category, productCount, imageUrl }) {
  const label = categoryLabel(category);
  
  return (
    <Link 
      to={`/?category=${category}`}
      className="category-card"
    >
      <div className="category-card-image-wrapper">
        <ImageWithFallback
          src={imageUrl} 
          alt={label}
          className="category-card-image"
          loading="lazy"
          fallbackText="Category"
        />
        <div className="category-card-overlay">
          <span className="shop-now-text">
            Shop Now
            <ChevronRight size={20} />
          </span>
        </div>
      </div>
      
      <div className="category-card-content">
        <h3 className="category-card-title">{label}</h3>
        <span className="category-card-count">
          {productCount} {productCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    </Link>
  );
}
