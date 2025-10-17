// CartRecommendations.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// Shows product recommendations based on what's in the cart
// ------------------------------------------------------------

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems } from '../features/cart/selectors.js';
import { listProducts } from '../services/productService';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/money.js';
import ImageWithFallback from './ImageWithFallback.jsx';
import { addItem } from '../features/cart/cartSlice.js';
import { showAddModal } from '../features/ui/uiSlice.js';

export default function CartRecommendations() {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);

  // Fetch all products
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: listProducts,
  });

  // Get recommended products based on cart items
  const recommendedProducts = useMemo(() => {
    if (!cartItems || cartItems.length === 0 || !allProducts || allProducts.length === 0) {
      return [];
    }

    // Get categories of items in cart
    const cartCategories = [...new Set(cartItems.map(item => item.category).filter(Boolean))];
    const cartProductIds = new Set(cartItems.map(item => item.id));

    // Filter products by same category, excluding items already in cart
    let recommendations = allProducts.filter(
      product => 
        !cartProductIds.has(product.id) && 
        cartCategories.includes(product.category)
    );

    // If not enough recommendations from same category, add other products
    if (recommendations.length < 2) {
      const otherProducts = allProducts.filter(
        product => !cartProductIds.has(product.id) && !recommendations.includes(product)
      );
      recommendations = [...recommendations, ...otherProducts];
    }

    // Sort by rating and return top 2
    return recommendations
      .sort((a, b) => (b?.rating?.rate ?? 0) - (a?.rating?.rate ?? 0))
      .slice(0, 2);
  }, [cartItems, allProducts]);

  if (isLoading) {
    return (
      <div className="cart-recommendations">
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>You Might Like</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card skeleton" style={{ height: 200 }}>Loading...</div>
          <div className="card skeleton" style={{ height: 200 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0 || recommendedProducts.length === 0) {
    return null;
  }

  return (
    <div className="cart-recommendations">
      <div style={{ 
        position: 'sticky', 
        top: 80,
        display: 'grid',
        gap: 12
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 0 }}>You Might Like</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 4, fontSize: 13 }}>
          Based on items in your cart
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          {recommendedProducts.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: 12,
                padding: 12,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              {/* Product Image */}
              <div style={{ 
                width: 80,
                height: 80,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 6,
                backgroundColor: '#f5f5f5',
                flexShrink: 0
              }}>
                <ImageWithFallback
                  src={product.image}
                  alt={product.title}
                  fallbackText="Product"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: 4
                  }}
                />
              </div>

              {/* Product Info */}
              <div style={{ display: 'grid', gap: 6, alignContent: 'space-between' }}>
                <div>
                  <h3 style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    margin: 0,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {product.title}
                  </h3>
                  {product.rating && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      fontSize: 11,
                      marginTop: 4
                    }}>
                      <span style={{ color: '#f59e0b' }}>★</span>
                      <span>{product.rating.rate?.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#2c3e50' }}>
                    {formatPrice(product.price)}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dispatch(addItem({ 
                        id: product.id, 
                        title: product.title, 
                        price: product.price, 
                        image: product.image, 
                        quantity: 1 
                      }));
                      dispatch(showAddModal({ 
                        title: product.title, 
                        image: product.image, 
                        quantity: 1, 
                        price: product.price 
                      }));
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
