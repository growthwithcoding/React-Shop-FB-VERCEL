// src/components/CategoryGrid.jsx
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories, listProducts } from '../services/productService';
import CategoryCard from './CategoryCard';
import { getPlaceholderUrl } from '../utils/placeholder';

/**
 * CategoryGrid - Grid of category cards for browsing
 * Displays below Hero section on home page (all categories view)
 */
export default function CategoryGrid() {
  // Fetch categories and products
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: listProducts,
  });

  // Calculate product counts and representative images per category
  const categoryData = useMemo(() => {
    if (!categories.length || !products.length) return [];

    return categories.map((category) => {
      // Filter products for this category (only active products)
      const categoryProducts = products.filter(
        (p) => p.category === category && p.status === 'active'
      );

      // Get first product image or use placeholder
      const firstProduct = categoryProducts[0];
      const imageUrl = firstProduct?.image || getPlaceholderUrl(400, 300, category, 'f5f5f5', '999999');

      return {
        category,
        productCount: categoryProducts.length,
        imageUrl,
      };
    });
  }, [categories, products]);

  const isLoading = loadingCategories || loadingProducts;

  if (isLoading) {
    return (
      <section className="category-grid-section">
        <h2 className="category-grid-title">Shop by Category</h2>
        <div className="category-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="category-card-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-content">
                <div className="skeleton-title" />
                <div className="skeleton-count" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categoryData.length) {
    return null;
  }

  return (
    <section className="category-grid-section">
      <h2 className="category-grid-title">Shop by Category</h2>
      <p className="category-grid-subtitle">
        Browse our curated collections
      </p>
      
      <div className="category-grid">
        {categoryData.map(({ category, productCount, imageUrl }) => (
          <CategoryCard
            key={category}
            category={category}
            productCount={productCount}
            imageUrl={imageUrl}
          />
        ))}
      </div>
    </section>
  );
}
