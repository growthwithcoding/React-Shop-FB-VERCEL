import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureStore } from '@reduxjs/toolkit'
import ProductCard from '../ProductCard'
import Cart from '../Cart'
import cartReducer from '../../features/cart/cartSlice'
import uiReducer from '../../features/ui/uiSlice'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Test helper to create a fresh Redux store
const createTestStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      ui: uiReducer,
    },
  })
}

// Test helper to render components with providers
const renderWithProviders = (component, store) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  )
}

describe('Cart Integration Tests - Add Product to Cart Flow', () => {
  const mockProduct = {
    id: 'prod-123',
    title: 'Wireless Headphones',
    price: 79.99,
    category: 'Electronics',
    description: 'High-quality wireless headphones with noise cancellation',
    image: 'https://example.com/headphones.jpg',
    rating: { rate: 4.7, count: 250 },
    inventory: 15,
  }

  it('should update cart when product is added from ProductCard', () => {
    const store = createTestStore()

    // Step 1: Render ProductCard component
    const { unmount } = renderWithProviders(<ProductCard product={mockProduct} />, store)

    // Step 2: Verify product information is displayed
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument()
    expect(screen.getByText(/\$79\.99/)).toBeInTheDocument()

    // Step 3: Click "Add to Cart" button
    const addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    // Step 4: Verify Redux store updated correctly
    const stateAfterAdd = store.getState()
    expect(stateAfterAdd.cart.items).toHaveLength(1)
    expect(stateAfterAdd.cart.items[0]).toMatchObject({
      id: 'prod-123',
      title: 'Wireless Headphones',
      price: 79.99,
      quantity: 1,
    })

    // Step 5: Unmount ProductCard and render Cart component
    unmount()
    renderWithProviders(<Cart />, store)

    // Step 6: Verify cart displays the added product
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument()
    expect(screen.getAllByText(/\$79\.99/)[0]).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()

    // Step 7: Verify subtotal is correct
    expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument()
  })

  it('should add multiple quantities from ProductCard to Cart', () => {
    const store = createTestStore()

    // Step 1: Render ProductCard
    const { unmount } = renderWithProviders(<ProductCard product={mockProduct} />, store)

    // Step 2: Change quantity to 3
    const qtyInput = screen.getByLabelText(/Quantity for Wireless Headphones/i)
    fireEvent.change(qtyInput, { target: { value: '3' } })

    // Step 3: Add to cart
    const addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    // Step 4: Verify store has correct quantity
    const stateAfterAdd = store.getState()
    expect(stateAfterAdd.cart.items[0].quantity).toBe(3)

    // Step 5: Switch to Cart view
    unmount()
    renderWithProviders(<Cart />, store)

    // Step 6: Verify cart shows correct quantity and total
    expect(screen.getByText('3')).toBeInTheDocument()
    
    // 79.99 * 3 = 239.97 (appears twice - line total and subtotal)
    expect(screen.getAllByText(/\$239\.97/)).toHaveLength(2)
  })

  it('should accumulate quantities when same product is added multiple times', () => {
    const store = createTestStore()

    // Step 1: Render ProductCard
    const { unmount } = renderWithProviders(<ProductCard product={mockProduct} />, store)

    // Step 2: Add product first time (quantity 1)
    let addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    // Step 3: Verify first addition
    let state = store.getState()
    expect(state.cart.items[0].quantity).toBe(1)

    // Step 4: Add product second time (quantity 2)
    const qtyInput = screen.getByLabelText(/Quantity for Wireless Headphones/i)
    fireEvent.change(qtyInput, { target: { value: '2' } })
    addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    // Step 5: Verify quantities accumulated (1 + 2 = 3)
    state = store.getState()
    expect(state.cart.items).toHaveLength(1) // Still one unique product
    expect(state.cart.items[0].quantity).toBe(3) // But quantity increased

    // Step 6: View in Cart
    unmount()
    renderWithProviders(<Cart />, store)

    // Step 7: Verify cart shows accumulated quantity
    expect(screen.getByText('3')).toBeInTheDocument()
    const qtyInputs = screen.getAllByRole('spinbutton')
    expect(qtyInputs[0]).toHaveValue(3)
  })

  it('should handle adding different products to cart', () => {
    const store = createTestStore()

    const product1 = mockProduct
    const product2 = {
      id: 'prod-456',
      title: 'Smart Watch',
      price: 199.99,
      category: 'Electronics',
      description: 'Feature-rich smartwatch',
      image: 'https://example.com/watch.jpg',
      rating: { rate: 4.5, count: 180 },
      inventory: 20,
    }

    // Step 1: Add first product
    const { unmount } = renderWithProviders(<ProductCard product={product1} />, store)
    fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }))
    unmount()

    // Step 2: Add second product
    renderWithProviders(<ProductCard product={product2} />, store)
    fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }))

    // Step 3: Verify store has both products
    const state = store.getState()
    expect(state.cart.items).toHaveLength(2)
    expect(state.cart.items[0].id).toBe('prod-123')
    expect(state.cart.items[1].id).toBe('prod-456')
  })

  it('should update cart totals when quantity is changed in Cart component', () => {
    const store = createTestStore()

    // Step 1: Add product via ProductCard
    const { unmount } = renderWithProviders(<ProductCard product={mockProduct} />, store)
    fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }))
    unmount()

    // Step 2: Open Cart
    renderWithProviders(<Cart />, store)

    // Initial state: 1 item, $79.99
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument()

    // Step 3: Increase quantity in cart
    const increaseButton = screen.getByLabelText(/Increase quantity/i)
    fireEvent.click(increaseButton)
    fireEvent.click(increaseButton) // Click twice to get to 3

    // Step 4: Verify updated totals
    expect(screen.getByText('3')).toBeInTheDocument()
    // 79.99 * 3 = 239.97 (appears twice - line total and subtotal)
    expect(screen.getAllByText(/\$239\.97/)).toHaveLength(2)
  })

  it('should remove product from cart and update totals', () => {
    const store = createTestStore()

    // Step 1: Add product
    const { unmount } = renderWithProviders(<ProductCard product={mockProduct} />, store)
    fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }))
    unmount()

    // Step 2: Open Cart
    renderWithProviders(<Cart />, store)

    // Verify product is in cart
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument()
    expect(screen.queryByText(/Cart's looking a little.*minimalist/i)).not.toBeInTheDocument()

    // Step 3: Remove product
    const removeButton = screen.getByRole('button', { name: /Remove.*from cart/i })
    fireEvent.click(removeButton)

    // Step 4: Verify empty cart state
    expect(screen.getByText(/Cart's looking a little.*minimalist/i)).toBeInTheDocument()
    expect(screen.queryByText('Wireless Headphones')).not.toBeInTheDocument()

    // Verify store is empty
    const state = store.getState()
    expect(state.cart.items).toHaveLength(0)
  })

  it('should respect inventory limits when adding products', () => {
    const limitedProduct = {
      ...mockProduct,
      inventory: 5, // Only 5 in stock
    }

    const store = createTestStore()

    // Step 1: Try to add 10 items (more than inventory)
    const { unmount } = renderWithProviders(<ProductCard product={limitedProduct} />, store)
    
    const qtyInput = screen.getByLabelText(/Quantity for Wireless Headphones/i)
    fireEvent.change(qtyInput, { target: { value: '10' } })

    const addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    // Step 2: Verify only 5 were added (limited by inventory)
    const state = store.getState()
    expect(state.cart.items[0].quantity).toBe(5)

    // Step 3: Verify in Cart view
    unmount()
    renderWithProviders(<Cart />, store)
    
    const cartQtyInputs = screen.getAllByRole('spinbutton')
    expect(cartQtyInputs[0]).toHaveValue(5)
  })

  it('should show low stock warning and update cart correctly', () => {
    const lowStockProduct = {
      ...mockProduct,
      inventory: 3, // Low stock
    }

    const store = createTestStore()

    // Step 1: Render ProductCard with low stock
    const { unmount } = renderWithProviders(<ProductCard product={lowStockProduct} />, store)

    // Step 2: Verify low stock warning is shown
    expect(screen.getByText(/Only 3 left in stock!/i)).toBeInTheDocument()

    // Step 3: Add all available items
    const qtyInput = screen.getByLabelText(/Quantity for Wireless Headphones/i)
    fireEvent.change(qtyInput, { target: { value: '3' } })

    const addButton = screen.getByRole('button', { name: /Add to Cart/i })
    fireEvent.click(addButton)

    // Step 4: Verify cart has correct quantity
    unmount()
    renderWithProviders(<Cart />, store)

    expect(screen.getByText('3')).toBeInTheDocument()
    const cartQtyInputs = screen.getAllByRole('spinbutton')
    expect(cartQtyInputs[0]).toHaveValue(3)
  })
})
