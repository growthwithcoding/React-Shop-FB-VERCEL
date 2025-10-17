// src/components/Hero.jsx
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listProducts,
  getProductsByCategory,
  categoryLabel,
} from "../services/productService";
import { getHeroContent, getPromos } from "../services/contentService";
import { listDiscounts, saveDiscountForCheckout } from "../services/discountService";
import { useAuth } from "../auth/useAuth";
import { Link } from "react-router-dom";
import { getPlaceholderUrl } from "../utils/placeholder";
import ImageWithFallback from "./ImageWithFallback";

const truncate = (s, n = 40) =>
  !s ? "" : s.length > n ? s.slice(0, n - 1) + "…" : s;

export default function Hero({ activeCategory = "all" }) {
  const { user } = useAuth();
  const normCat = activeCategory;
  const viewingCategory = !!(normCat && normCat !== "all");

  // Products for current context
  const {
    data: products = [],
    isLoading: loadingProducts,
    isError: productsError,
  } = useQuery({
    queryKey: ["hero-products", normCat],
    queryFn: () =>
      viewingCategory ? getProductsByCategory(normCat) : listProducts(),
    staleTime: 0, // Always refetch to ensure fresh category data
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Hero copy - category-aware
  const heroCopy = useMemo(() => {
    if (viewingCategory) {
      // Category-specific headlines
      const categoryHeadlines = {
        'baseball-bats': {
          kicker: 'Power at the Plate',
          headline: 'Premium Baseball Bats',
        },
        'baseball-gloves': {
          kicker: 'Catch Every Play',
          headline: 'Professional Baseball Gloves',
        },
        'batting-gloves': {
          kicker: 'Superior Grip & Control',
          headline: 'Elite Batting Gloves',
        },
        'batting-helmets': {
          kicker: 'Safety First',
          headline: 'Protective Batting Helmets',
        },
        'catcher-equipment': {
          kicker: 'Behind the Plate',
          headline: "Catcher's Gear & Equipment",
        },
        'protective-gear': {
          kicker: 'Stay Protected',
          headline: 'Essential Protective Gear',
        },
        'training-equipment': {
          kicker: 'Level Up Your Game',
          headline: 'Training & Practice Equipment',
        },
        'accessories': {
          kicker: 'Complete Your Kit',
          headline: 'Baseball Accessories',
        },
      };
      
      return categoryHeadlines[normCat] || {
        kicker: categoryLabel(normCat),
        headline: `Shop ${categoryLabel(normCat)}`,
      };
    }
    
    // Default homepage copy
    return {
      kicker: "Step Up to the Plate",
      headline: "Gear Up. Play Hard. Win Big.",
    };
  }, [viewingCategory, normCat]);

  const {
    isLoading: loadingCopy,
  } = useQuery({
    queryKey: ["hero-content"],
    queryFn: getHeroContent,
    enabled: false, // Disable since we're using static copy above
  });

  // Promos
  const {
    data: promos = [],
  } = useQuery({
    queryKey: ["hero-promos"],
    queryFn: getPromos,
  });

  // Active discounts
  const {
    data: discounts = [],
  } = useQuery({
    queryKey: ["hero-discounts"],
    queryFn: listDiscounts,
  });

  // Select random active discount
  const activeDiscount = useMemo(() => {
    const activeDiscounts = discounts.filter(d => d.isActive === true);
    if (!activeDiscounts.length) return null;

    // Filter by category if viewing a specific category
    const categoryDiscounts = viewingCategory 
      ? activeDiscounts.filter(d => d.category === normCat || !d.category)
      : activeDiscounts;

    // If we have category-specific discounts, use those, otherwise use any active discount
    const availableDiscounts = categoryDiscounts.length > 0 ? categoryDiscounts : activeDiscounts;
    
    // Select random discount
    const randomIndex = Math.floor(Math.random() * availableDiscounts.length);
    return availableDiscounts[randomIndex];
  }, [discounts, viewingCategory, normCat]);

  // Build tiles - show actual products from current category/context
  const productTiles = useMemo(() => {
    // Shuffle products to show different ones each time
    const shuffledProducts = (products || [])
      .slice()
      .sort(() => Math.random() - 0.5);

    // Get up to 4 products, or whatever is available
    const availableProducts = shuffledProducts.slice(0, 4);
    
    // If we have fewer than 4 products, cycle through available ones to fill slots
    const tiles = Array.from({ length: 4 }).map((_, i) => {
      const p = availableProducts[i % Math.max(availableProducts.length, 1)];
      
      if (!p) {
        // Fallback for completely empty state
        return {
          img: getPlaceholderUrl(400, 300, 'Product', 'f5f5f5', '999999'),
          label: 'Product',
          href: "/#hero-start",
        };
      }

      // Use product image, falling back to placeholder
      const imageUrl = p.image && p.image.trim() && !p.image.includes('fakestoreapi') 
        ? p.image 
        : getPlaceholderUrl(400, 300, truncate(p.title || 'Product', 20), 'f5f5f5', '999999');

      return {
        img: imageUrl,
        label: truncate(p.title, 30),
        href: `/product/${p.id}`,
      };
    });

    return tiles;
  }, [products]);

  const showSkeleton = loadingProducts || loadingCopy;
  const promo = (promos && promos[0]) || null;
  
  // Format discount display text
  const getDiscountText = (discount) => {
    if (!discount) return null;
    if (discount.type === 'percentage') {
      return `Use code ${discount.code} for ${discount.value}% OFF!`;
    } else if (discount.type === 'fixed') {
      return `Use code ${discount.code} for $${discount.value} OFF!`;
    } else if (discount.type === 'free_shipping') {
      return `Use code ${discount.code} for FREE SHIPPING!`;
    }
    return `Use code ${discount.code}`;
  };

  // Handle promo click - save discount code and navigate to checkout
  const handlePromoClick = (e, discountCode) => {
    e.preventDefault();
    if (discountCode) {
      console.log('Saving discount code:', discountCode);
      saveDiscountForCheckout(discountCode);
      console.log('Saved codes:', localStorage.getItem('savedDiscountCodes'));
      
      // Show user feedback with a brief notification
      const notification = document.createElement('div');
      notification.textContent = `✓ ${discountCode} saved! Code will be applied at checkout.`;
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }, 2500);
    }
    // Scroll to products
    const productsSection = document.getElementById('products-start');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero-start" className="hero-v2" style={{ margin: '0 0 16px' }}>
      {/* Header */}
      <div className="hero-headline" style={{ marginBottom: '12px' }}>
        <div className="hero-title-wrap">
          <div className="kicker" style={{ marginBottom: '4px' }}>
            {heroCopy.kicker}
          </div>
          <h1 className="hero-title" style={{ margin: 0 }}>
            {heroCopy.headline}
          </h1>
        </div>
      </div>

      {/* Hero Grid - 5 cards layout */}
      <div className="hero-grid-v2">
        {showSkeleton ? (
          <>
            <div className="hero-card hero-card-large skeleton">Loading...</div>
            <div className="hero-card hero-card-promo skeleton">Loading...</div>
            <div className="hero-card skeleton">Loading...</div>
            <div className="hero-card skeleton">Loading...</div>
            <div className="hero-card skeleton">Loading...</div>
          </>
        ) : (
          <>
            {/* Large card - first product */}
            <Link 
              key={`${normCat}-large-${productTiles[0].label}`}
              to={productTiles[0].href} 
              className="hero-card hero-card-large"
            >
              <ImageWithFallback
                src={productTiles[0].img}
                alt={productTiles[0].label}
                className="hero-card-image"
                fallbackText="Product"
                style={{ width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none' }}
              />
              <div className="hero-card-overlay">
                <h3>{productTiles[0].label}</h3>
              </div>
            </Link>

            {/* Promo card - shows active discount if available */}
            {activeDiscount ? (
              <a 
                href="#products-start" 
                className="hero-card hero-card-promo"
                style={{ 
                  backgroundColor: viewingCategory ? "#fff4e6" : "#e8f5e9",
                  cursor: "pointer"
                }}
                onClick={(e) => handlePromoClick(e, activeDiscount.code)}
              >
                <div className="promo-content">
                  <h3>{getDiscountText(activeDiscount)}</h3>
                  <span className="promo-badge">
                    {viewingCategory ? `${categoryLabel(normCat)} Special` : 'Store-Wide Offer'}
                  </span>
                </div>
              </a>
            ) : promo ? (
              <a 
                href={promo.ctaHref || "#hero-start"} 
                className="hero-card hero-card-promo"
                style={{ backgroundColor: "#e8f5e9" }}
              >
                <div className="promo-content">
                  <h3>{promo.title || "Use code REACT20 for 20% OFF."}</h3>
                  <span className="promo-badge">Special Offer</span>
                </div>
              </a>
            ) : (
              <div className="hero-card hero-card-promo" style={{ backgroundColor: "#e8f5e9" }}>
                <div className="promo-content">
                  <h3>Check back for special offers!</h3>
                  <span className="promo-badge">Coming Soon</span>
                </div>
              </div>
            )}

            {/* Remaining product cards */}
            {productTiles.slice(1).map((tile, idx) => (
              <Link 
                key={`${normCat}-${idx}-${tile.label}`}
                to={tile.href} 
                className="hero-card"
              >
                <ImageWithFallback
                  src={tile.img}
                  alt={tile.label}
                  className="hero-card-image"
                  fallbackText="Product"
                  style={{ width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none' }}
                />
                <div className="hero-card-overlay">
                  <h3>{tile.label}</h3>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Empty state */}
      {!showSkeleton && !productsError && products.length === 0 && user?.role === "admin" && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/admin/products" className="btn btn-primary">
            + Add your first product
          </Link>
        </div>
      )}
    </section>
  );
}
