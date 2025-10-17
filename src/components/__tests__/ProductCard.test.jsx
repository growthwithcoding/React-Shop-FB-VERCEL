import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import ProductCard from '../ProductCard'
import cartReducer from '../../features/cart/cartSlice'
import uiReducer from '../../features/ui/uiSlice'

// Test helper to create a fresh store for each test
const createTestStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      ui: uiReducer,
    },
  })
}

// Test helper to render component with all required providers
const renderWithProviders = (component, store = createTestStore()) => {
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store,
  }
}

describe('ProductCard Component - Unit Tests', () => {
  const mockProduct = {
    id: '1',
    title: 'Test Product',
    price: 29.99,
    category: 'Electronics',
    description: 'A great test product',
    image: 'https://example.com/product.jpg',
    rating: { rate: 4.5, count: 100 },
    inventory: 10,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: Component renders with correct product information
  it('renders product information correctly', () => {
    renderWithProviders(<ProductCard product={mockProduct} />)

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText(/\$29\.99/)).toBeInTheDocument()
    expect(screen.getByText(/Electronics/)).toBeInTheDocument()
    expect(screen.getByText(/⭐ 4\.5/)).toBeInTheDocument()
    // Note: ProductCard doesn't display full description, only truncated or not at all
  })

  // Test 2: Quantity input changes work correctly
  it('updates quantity when user changes input', () => {
    renderWithProviders(<ProductCard product={mockProduct} />)

    const qtyInput = screen.getByLabelText(/Quantity for Test Product/i)
    expect(qtyInput).toHaveValue(1)

    fireEvent.change(qtyInput, { target: { value: '5' } })
    expect(qtyInput).toHaveValue(5)
  })

  // Test 3: Add to Cart button dispatches correct action
  it('dispatches addItem action when Add to Cart is clicked', () => {
    const store = createTestStore()
    renderWithProviders(<ProductCard product={mockProduct} />, store)

    const addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    const state = store.getState()
    expect(state.cart.items).toHaveLength(1)
    expect(state.cart.items[0]).toEqual({
      id: '1',
      title: 'Test Product',
      price: 29.99,
      image: 'https://example.com/product.jpg',
      quantity: 1,
    })
  })

  // Test 4: Out of stock state displays correctly
  it('displays out of stock badge and disables button when inventory is 0', () => {
    const outOfStockProduct = { ...mockProduct, inventory: 0 }
    renderWithProviders(<ProductCard product={outOfStockProduct} />)

    expect(screen.getByText('OUT OF STOCK')).toBeInTheDocument()
    
    const addButton = screen.getByRole('button', { name: /Out of Stock/i })
    expect(addButton).toBeDisabled()
    
    const qtyInput = screen.getByLabelText(/Quantity for Test Product/i)
    expect(qtyInput).toBeDisabled()
  })

  // Test 5: Low inventory warning displays correctly
  it('shows low inventory warning when stock is 10 or less', () => {
    const lowStockProduct = { ...mockProduct, inventory: 5 }
    renderWithProviders(<ProductCard product={lowStockProduct} />)

    expect(screen.getByText('Only 5 left in stock!')).toBeInTheDocument()
  })

  // Test 6: Image fallback works on error
  it('uses fallback image when main image fails to load', () => {
    renderWithProviders(<ProductCard product={mockProduct} />)

    const img = screen.getByAltText('Test Product')
    expect(img).toBeInTheDocument()

    // Simulate image load error
    fireEvent.error(img)

    // Check that src changed to fallback (placehold.co URL pattern)
    expect(img.src).toContain('placehold')
  })

  // Test 7: Add to cart with custom quantity
  it('adds correct quantity to cart when quantity is changed', () => {
    const store = createTestStore()
    renderWithProviders(<ProductCard product={mockProduct} />, store)

    const qtyInput = screen.getByLabelText(/Quantity for Test Product/i)
    fireEvent.change(qtyInput, { target: { value: '3' } })

    const addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    const state = store.getState()
    expect(state.cart.items[0].quantity).toBe(3)
  })

  // Test 8: Link to product detail page exists
  it('contains a link to product detail page', () => {
    renderWithProviders(<ProductCard product={mockProduct} />)

    const links = screen.getAllByRole('link', { name: /Test Product/i })
    // There may be multiple links (image and title), just check one has correct href
    expect(links[0]).toHaveAttribute('href', '/product/1')
  })

  // Test 9: Handles product with no rating gracefully
  it('displays N/A when product has no rating', () => {
    const noRatingProduct = { ...mockProduct, rating: undefined }
    renderWithProviders(<ProductCard product={noRatingProduct} />)

    expect(screen.getByText(/⭐ N\/A/)).toBeInTheDocument()
  })

  // Test 10: Respects max inventory limit when adding to cart
  it('limits quantity to available inventory when adding to cart', () => {
    const limitedProduct = { ...mockProduct, inventory: 3 }
    const store = createTestStore()
    renderWithProviders(<ProductCard product={limitedProduct} />, store)

    const qtyInput = screen.getByLabelText(/Quantity for Test Product/i)
    fireEvent.change(qtyInput, { target: { value: '10' } })

    const addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    const state = store.getState()
    // Should be limited to inventory amount (3)
    expect(state.cart.items[0].quantity).toBe(3)
  })
})
