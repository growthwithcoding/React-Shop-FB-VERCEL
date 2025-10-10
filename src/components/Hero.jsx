// src/components/Hero.jsx
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listProducts,
  getProductsByCategory,
  getCategories,
  categoryLabel,
} from "../services/productService";
import { getHeroContent, getPromos } from "../services/contentService";
import { listDiscounts, saveDiscountForCheckout } from "../services/discountService";
import { useAuth } from "../auth/useAuth";
import { Link } from "react-router-dom";

const FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3EProduct%3C/text%3E%3C/svg%3E';

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
  });

  // Categories (labels for home mode)
  const {
    data: categories = [],
    isLoading: loadingCats,
  } = useQuery({
    queryKey: ["hero-categories"],
    queryFn: getCategories,
  });

  // Hero copy
  const {
    data: heroCopy = {
      homeKicker: "Today's Picks",
      homeHeadline: "Add It. Love It. Keep It Simple.",
    },
    isLoading: loadingCopy,
  } = useQuery({
    queryKey: ["hero-content"],
    queryFn: getHeroContent,
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

  // Build tiles - need 4 product cards for the layout
  const productTiles = useMemo(() => {
    const first4 = (products || [])
      .slice()
      .sort(
        (a, b) =>
          (b?.rating?.rate ?? 0) - (a?.rating?.rate ?? 0) ||
          (Number(b?.price ?? 0) - Number(a?.price ?? 0))
      )
      .slice(0, 4);

    return Array.from({ length: 4 }).map((_, i) => {
      const p = first4[i];
      const catLabels = (categories || []).map((c) => categoryLabel(c));
      const maybeLabel = catLabels[i % Math.max(catLabels.length, 1)] || "Product";

      // Use fallback for missing images or fakestoreapi (which often 404s)
      const imageUrl = p?.image && p.image.trim() && !p.image.includes('fakestoreapi') ? p.image : FALLBACK;

      return {
        img: imageUrl,
        label: p?.title ? truncate(p.title, 30) : maybeLabel,
        href: p?.id ? `/product/${p.id}` : "/#hero-start",
      };
    });
  }, [products, categories]);

  const showSkeleton = loadingProducts || loadingCats || loadingCopy;
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
    <section id="hero-start" className="hero-v2">
      {/* Header */}
      <div className="hero-headline">
        <div className="hero-title-wrap">
          <div className="kicker">
            {heroCopy.homeKicker || "Today's Picks"}
          </div>
          <h1 className="hero-title" style={{ margin: 0 }}>
            {heroCopy.homeHeadline || "Add It. Love It. Keep It Simple."}
          </h1>
        </div>
        <a
          href="#products-start"
          className="btn btn-primary"
          style={{ 
            backgroundColor: "#febd69", 
            color: "#111", 
            fontWeight: 700,
            padding: "12px 24px",
            borderRadius: 8,
            border: "none"
          }}
        >
          Shop Now
        </a>
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
              to={productTiles[0].href} 
              className="hero-card hero-card-large"
              style={{ 
                backgroundImage: `url(${productTiles[0].img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
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
                key={idx}
                to={tile.href} 
                className="hero-card"
                style={{ 
                  backgroundImage: `url(${tile.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
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
