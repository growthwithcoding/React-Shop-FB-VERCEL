// src/pages/ProductPage.jsx
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProduct, getProductsByCategory } from '../services/productService'
import { useDispatch } from 'react-redux'
import { addItem } from '../features/cart/cartSlice.js'
import { showAddModal } from '../features/ui/uiSlice.js'
import { useState } from 'react'
import { formatPrice } from '../utils/money.js'
import ProductCard from '../components/ProductCard.jsx'
import BreadcrumbNav from '../components/BreadcrumbNav'

const FALLBACK = 'https://via.placeholder.com/400x400?text=Product'

/**
 * ProductPage Component
 * Redesigned with comprehensive UI/UX best practices including:
 * - Clear information hierarchy
 * - Product variations support
 * - Image zoom functionality
 * - Detailed specifications
 * - Shipping and returns information
 * - Placeholder sections for future features
 * - Mobile-responsive and accessible design
 */
export default function ProductPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  
  // State for product variations
  // TODO: When backend provides variation data, replace these null values
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)

  // Load the product (safe: returns null if not found)
  const {
    data: p,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
  })

  // Related products (same category)
  const { data: related = [] } = useQuery({
    enabled: !!p?.category,
    queryKey: ['related', p?.category],
    queryFn: () => getProductsByCategory(p.category),
  })

  if (isLoading) {
    return (
      <>
        <BreadcrumbNav
          currentPage="Product"
          backButton={{ label: "Back to Shop", path: "/" }}
        />
        <div className="container-xl" style={{ paddingTop: 16, paddingBottom: 24 }}>
          <div className="card">
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p>Loading product details...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (isError || !p) {
    return (
      <>
        <BreadcrumbNav
          currentPage="Product Not Found"
          backButton={{ label: "Back to Shop", path: "/" }}
        />
        <div className="container-xl" style={{ paddingTop: 16, paddingBottom: 24 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Product not found</h3>
            <p>We couldn't load this product. It may have been removed.</p>
            <Link className="btn btn-secondary btn-slim" to="/">Back to Home</Link>
          </div>
        </div>
      </>
    )
  }

  const inventory = p.inventory ?? 0
  const isOutOfStock = inventory === 0
  const isLowStock = !isOutOfStock && inventory <= 10

  // TODO: Replace with actual product images array from backend
  // Currently using single image, but structure supports multiple images
  const productImages = p.images || [p.image || FALLBACK]
  
  // TODO: Replace with actual variation data from backend
  // Set to null until backend provides this data
  const availableSizes = p.sizes || null
  const availableColors = p.colors || null
  
  // TODO: Replace with actual specifications from backend
  // Set to null until backend provides this data
  const specifications = p.specifications || null
  
  // TODO: Replace with actual testimonials from backend
  // Set to null until backend provides this data
  const testimonials = null

  const add = () => {
    if (isOutOfStock) return
    
    const quantity = Math.max(1, Number(qty) || 1)
    const finalQuantity = Math.min(quantity, inventory)
    
    dispatch(addItem({ 
      id: p.id, 
      title: p.title, 
      price: p.price, 
      image: p.image, 
      quantity: finalQuantity 
    }))
    dispatch(showAddModal({ 
      title: p.title, 
      image: p.image, 
      quantity: finalQuantity, 
      price: p.price 
    }))
  }

  const handleImageZoom = () => {
    setIsZoomed(!isZoomed)
  }

  return (
    <>
      <BreadcrumbNav
        currentPage={p.title}
        backButton={{ label: "Back to Shop", path: "/" }}
      />
      
      <main className="container-xl" style={{ paddingTop: 16, paddingBottom: 24 }}>
        {/* Product Header */}
        <div className="hero-headline" style={{ marginBottom: 16 }}>
          <div>
            <div className="kicker" style={{ fontSize: '14px', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>
              {p.category || 'General'}
            </div>
            <h1 style={{ margin: 0, fontSize: '32px', lineHeight: 1.2 }}>
              {p.title}
            </h1>
            {p.rating && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fbbf24', fontSize: '18px' }}>
                  {'⭐'.repeat(Math.round(p.rating.rate))}
                </span>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {p.rating.rate} ({p.rating.count} reviews)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Product Grid */}
        <section 
          className="grid" 
          style={{ 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', 
            gap: 24,
            marginBottom: 32
          }}
        >
          {/* Left Column: Product Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Main Image with Zoom */}
            <div 
              className="card" 
              style={{ 
                padding: 20,
                position: 'relative',
                cursor: 'zoom-in',
                overflow: 'hidden'
              }}
              onClick={handleImageZoom}
              role="button"
              tabIndex={0}
              aria-label="Click to zoom image"
              onKeyDown={(e) => e.key === 'Enter' && handleImageZoom()}
            >
              {/* Stock Status Badge */}
              {isOutOfStock && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    background: '#dc3545',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    zIndex: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                  role="status"
                  aria-live="polite"
                >
                  OUT OF STOCK
                </div>
              )}
              
              <img
                src={productImages[selectedImage]}
                alt={`${p.title} - View ${selectedImage + 1}`}
                style={{ 
                  width: '100%', 
                  height: isZoomed ? 'auto' : '450px',
                  objectFit: isZoomed ? 'cover' : 'contain',
                  transition: 'transform 0.3s ease',
                  transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                }}
                onError={(e) => { e.currentTarget.src = FALLBACK }}
              />
              
              <div 
                style={{ 
                  textAlign: 'center', 
                  marginTop: '12px', 
                  fontSize: '13px', 
                  color: '#666' 
                }}
              >
                🔍 Click to {isZoomed ? 'zoom out' : 'zoom in'}
              </div>
            </div>

            {/* Image Thumbnails - Multiple Angle Support */}
            {productImages.length > 1 && (
              <div 
                style={{ 
                  display: 'flex', 
                  gap: 12, 
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}
                role="tablist"
                aria-label="Product image gallery"
              >
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(idx)
                      setIsZoomed(false)
                    }}
                    style={{
                      width: '80px',
                      height: '80px',
                      border: selectedImage === idx ? '3px solid #007bff' : '2px solid #ddd',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: 4,
                      background: 'white',
                      transition: 'all 0.2s ease'
                    }}
                    role="tab"
                    aria-selected={selectedImage === idx}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => { e.currentTarget.src = FALLBACK }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Price and Availability Card */}
            <div className="card" style={{ padding: 24 }}>
              {/* Price - Prominent Display */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: 4 }}>
                  Price
                </label>
                <span 
                  style={{ 
                    fontSize: '36px', 
                    fontWeight: 'bold', 
                    color: '#2c3e50',
                    display: 'block'
                  }}
                >
                  {formatPrice(p.price)}
                </span>
              </div>

              {/* Availability Status */}
              <div 
                style={{ 
                  marginBottom: 20,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: isOutOfStock ? '#fee' : isLowStock ? '#fff3cd' : '#d1f2eb',
                  border: `1px solid ${isOutOfStock ? '#fcc' : isLowStock ? '#ffeeba' : '#a3e4d7'}`
                }}
                role="status"
                aria-live="polite"
              >
                <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#2c3e50' }}>
                  Availability
                </div>
                {isOutOfStock ? (
                  <span style={{ color: '#dc3545', fontWeight: '600' }}>
                    Out of Stock - Currently Unavailable
                  </span>
                ) : isLowStock ? (
                  <span style={{ color: '#856404', fontWeight: '600' }}>
                    Only {inventory} left in stock - Order soon!
                  </span>
                ) : (
                  <span style={{ color: '#155724', fontWeight: '600' }}>
                    In Stock - Ready to ship
                  </span>
                )}
              </div>

              {/* Product Variations - Size */}
              {availableSizes ? (
                <div style={{ marginBottom: 16 }}>
                  <label 
                    htmlFor="size-select"
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      display: 'block', 
                      marginBottom: 8,
                      color: '#2c3e50'
                    }}
                  >
                    Size
                  </label>
                  <select
                    id="size-select"
                    className="input"
                    value={selectedSize || ''}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    style={{ width: '100%' }}
                    aria-label="Select product size"
                  >
                    <option value="">Select a size</option>
                    {availableSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div 
                  style={{ 
                    marginBottom: 16,
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px dashed #dee2e6',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#6c757d'
                  }}
                  role="status"
                >
                  Feature coming soon – size options will appear here
                </div>
              )}

              {/* Product Variations - Color */}
              {availableColors ? (
                <div style={{ marginBottom: 16 }}>
                  <label 
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      display: 'block', 
                      marginBottom: 8,
                      color: '#2c3e50'
                    }}
                  >
                    Color
                  </label>
                  <div 
                    style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
                    role="radiogroup"
                    aria-label="Select product color"
                  >
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          border: selectedColor === color ? '3px solid #007bff' : '2px solid #ddd',
                          background: color.toLowerCase(),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: selectedColor === color ? '0 2px 8px rgba(0,123,255,0.3)' : 'none'
                        }}
                        role="radio"
                        aria-checked={selectedColor === color}
                        aria-label={`Color: ${color}`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div 
                  style={{ 
                    marginBottom: 16,
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px dashed #dee2e6',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#6c757d'
                  }}
                  role="status"
                >
                  Feature coming soon – color options will appear here
                </div>
              )}

              {/* Quantity and Add to Cart - Same Row, Right Aligned */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: 'auto'
                }}
              >
                <div>
                  <label 
                    htmlFor="quantity-input"
                    style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      display: 'block', 
                      marginBottom: 6,
                      color: '#2c3e50'
                    }}
                  >
                    Qty
                  </label>
                  <input
                    id="quantity-input"
                    className="input"
                    type="number"
                    min="1"
                    max={isOutOfStock ? 0 : inventory}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    style={{ width: '80px' }}
                    disabled={isOutOfStock}
                    aria-label="Product quantity"
                  />
                </div>

                <div style={{ paddingTop: '20px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={add}
                    disabled={isOutOfStock}
                    style={{
                      padding: '10px 20px',
                      fontSize: '15px',
                      fontWeight: '600',
                      opacity: isOutOfStock ? 0.5 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                    aria-label={isOutOfStock ? 'Product out of stock' : 'Add to cart'}
                  >
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>

            {/* Product Description Card */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ marginTop: 0, fontSize: '20px', marginBottom: 12 }}>
                Product Description
              </h2>
              <p style={{ lineHeight: 1.6, color: '#555', margin: 0 }}>
                {p.description || p.fullDescription || 'No description available.'}
              </p>
            </div>

            {/* Shipping and Returns Information */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ marginTop: 0, fontSize: '20px', marginBottom: 16 }}>
                Shipping & Returns
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
                  <span style={{ fontSize: '20px' }}>🚚</span>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: 4 }}>Free Shipping</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      On orders over $50. Standard delivery in 5-7 business days.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
                  <span style={{ fontSize: '20px' }}>↩️</span>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: 4 }}>30-Day Returns</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Easy returns within 30 days of purchase. Item must be unused.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
                  <span style={{ fontSize: '20px' }}>🔒</span>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: 4 }}>Secure Checkout</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Your payment information is processed securely.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Specifications Section */}
        <section className="card" style={{ padding: 24, marginBottom: 32 }}>
          <h2 style={{ marginTop: 0, fontSize: '24px', marginBottom: 20 }}>
            Product Specifications
          </h2>
          {specifications ? (
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 16 
              }}
            >
              {Object.entries(specifications).map(([key, value]) => (
                <div 
                  key={key}
                  style={{ 
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4, textTransform: 'uppercase' }}>
                    {key}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // TODO: Replace this placeholder when specifications data is available
            <div 
              style={{ 
                padding: '40px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '2px dashed #dee2e6',
                textAlign: 'center'
              }}
              role="status"
            >
              <div style={{ fontSize: '48px', marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: '16px', color: '#6c757d', fontWeight: '500' }}>
                Feature coming soon – detailed specifications will appear here
              </div>
              <div style={{ fontSize: '14px', color: '#adb5bd', marginTop: 8 }}>
                Including dimensions, materials, weight, and technical details
              </div>
            </div>
          )}
        </section>

        {/* Customer Testimonials Section - Placeholder for Future Feature */}
        <section className="card" style={{ padding: 24, marginBottom: 32 }}>
          <h2 style={{ marginTop: 0, fontSize: '24px', marginBottom: 20 }}>
            Customer Testimonials
          </h2>
          {testimonials ? (
            // TODO: When testimonials data is available, replace this with actual testimonial rendering
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {testimonials.map((testimonial, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#fbbf24' }}>
                      {'⭐'.repeat(testimonial.rating)}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px 0', fontStyle: 'italic' }}>
                    "{testimonial.comment}"
                  </p>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    - {testimonial.customerName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Placeholder for testimonials feature
            <div 
              style={{ 
                padding: '40px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '2px dashed #dee2e6',
                textAlign: 'center'
              }}
              role="status"
            >
              <div style={{ fontSize: '48px', marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: '16px', color: '#6c757d', fontWeight: '500' }}>
                Feature coming soon – testimonials will appear here
              </div>
              <div style={{ fontSize: '14px', color: '#adb5bd', marginTop: 8 }}>
                Customer reviews and testimonials will be displayed once available
              </div>
            </div>
          )}
        </section>

        {/* Related Products Section */}
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: '24px', marginBottom: 20 }}>
            You Might Also Like
          </h2>
          <div 
            style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 20
            }}
          >
            {(related || [])
              .filter(r => r.id !== p.id)
              .slice(0, 8)
              .map(r => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      </main>
    </>
  )
}
