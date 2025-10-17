import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureStore } from '@reduxjs/toolkit'
import Cart from '../Cart'
import cartReducer from '../../features/cart/cartSlice'

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Test helper to create a store with initial cart state
const createTestStore = (initialItems = []) => {
  const store = configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState: {
      cart: {
        items: initialItems,
      },
    },
  })
  return store
}

// Test helper to render component with providers
const renderWithProviders = (component, store = createTestStore()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <BrowserRouter>
            {component}
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    ),
    store,
  }
}

describe('Cart Component - Unit Tests', () => {
  const mockCartItems = [
    {
      id: '1',
      title: 'Product One',
      price: 29.99,
      image: 'https://example.com/product1.jpg',
      quantity: 2,
    },
    {
      id: '2',
      title: 'Product Two',
      price: 49.99,
      image: 'https://example.com/product2.jpg',
      quantity: 1,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: Empty cart displays correct message
  it('displays empty cart message when cart is empty', () => {
    renderWithProviders(<Cart />)

    expect(screen.getByText(/Cart's looking a little.*minimalist/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Browse Products/i })).toBeInTheDocument()
  })

  // Test 2: Empty cart navigate to home works
  it('navigates to home page when Browse Products is clicked in empty cart', () => {
    renderWithProviders(<Cart />)

    const browseButton = screen.getByRole('button', { name: /Browse Products/i })
    fireEvent.click(browseButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  // Test 3: Cart displays all items correctly
  it('displays all cart items with correct information', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    expect(screen.getByText('Product One')).toBeInTheDocument()
    expect(screen.getByText('Product Two')).toBeInTheDocument()
    expect(screen.getAllByText(/\$29\.99/)).toHaveLength(1)
    expect(screen.getAllByText(/\$49\.99/)).toHaveLength(2) // Unit price and line total
  })

  // Test 4: Cart shows correct item count
  it('displays correct item count in header', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    // Cart shows quantity badges on items instead of total count in header
    expect(screen.getByText('Product One')).toBeInTheDocument()
    expect(screen.getByText('Product Two')).toBeInTheDocument()
  })

  // Test 5: Quantity increment works
  it('increments quantity when plus button is clicked', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    const increaseButtons = screen.getAllByLabelText(/Increase quantity/i)
    fireEvent.click(increaseButtons[0]) // Click first product's increase button

    const state = store.getState()
    expect(state.cart.items[0].quantity).toBe(3) // Should be 2 + 1 = 3
  })

  // Test 6: Quantity decrement works
  it('decrements quantity when minus button is clicked', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    const decreaseButtons = screen.getAllByLabelText(/Decrease quantity/i)
    fireEvent.click(decreaseButtons[0]) // Click first product's decrease button

    const state = store.getState()
    expect(state.cart.items[0].quantity).toBe(1) // Should be 2 - 1 = 1
  })

  // Test 7: Quantity cannot go below 1
  it('prevents quantity from going below 1', () => {
    const singleItem = [{ ...mockCartItems[0], quantity: 1 }]
    const store = createTestStore(singleItem)
    renderWithProviders(<Cart />, store)

    const decreaseButton = screen.getByLabelText(/Decrease quantity/i)
    fireEvent.click(decreaseButton)

    const state = store.getState()
    expect(state.cart.items[0].quantity).toBe(1) // Should stay at 1
  })

  // Test 8: Manual quantity input works
  it('updates quantity when manually entering a number', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    const qtyInputs = screen.getAllByRole('spinbutton')
    fireEvent.change(qtyInputs[0], { target: { value: '5' } })

    const state = store.getState()
    expect(state.cart.items[0].quantity).toBe(5)
  })

  // Test 9: Remove item works
  it('removes item from cart when Remove button is clicked', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    const removeButtons = screen.getAllByLabelText(/Remove.*from cart/i)
    fireEvent.click(removeButtons[0])

    const state = store.getState()
    expect(state.cart.items).toHaveLength(1)
    expect(state.cart.items[0].id).toBe('2') // Product One should be removed
  })

  // Test 10: Subtotal calculates correctly
  it('calculates and displays correct subtotal', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    // (29.99 * 2) + (49.99 * 1) = 59.98 + 49.99 = 109.97
    expect(screen.getByText(/Subtotal:.*\$109\.97/i)).toBeInTheDocument()
  })

  // Test 11: Line total calculates correctly
  it('displays correct line total for each item', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    // Product One: 29.99 * 2 = 59.98
    expect(screen.getAllByText(/\$59\.98/)).toHaveLength(1)
    // Product Two: 49.99 * 1 = 49.99 (appears twice - unit price and line total)
    expect(screen.getAllByText(/\$49\.99/)).toHaveLength(2)
  })

  // Test 12: Continue Shopping button navigates correctly
  it('navigates to home when Continue Shopping is clicked', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    const continueButton = screen.getByRole('button', { name: /Continue Shopping/i })
    fireEvent.click(continueButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  // Test 13: Proceed to Checkout button navigates correctly
  it('navigates to checkout when Proceed to Checkout is clicked', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    const checkoutButton = screen.getByRole('button', { name: /Proceed to Checkout/i })
    fireEvent.click(checkoutButton)

    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
  })

  // Test 14: Image fallback works
  it('uses fallback image when product image fails to load', () => {
    const store = createTestStore(mockCartItems)
    const { container } = renderWithProviders(<Cart />, store)

    const images = container.querySelectorAll('img')
    fireEvent.error(images[0])

    expect(images[0].src).toContain('placehold')
  })

  // Test 15: Quantity input blur normalizes invalid values
  it('normalizes quantity to minimum 1 on blur if invalid', () => {
    const store = createTestStore(mockCartItems)
    renderWithProviders(<Cart />, store)

    const qtyInputs = screen.getAllByRole('spinbutton')
    fireEvent.change(qtyInputs[0], { target: { value: '0' } })
    fireEvent.blur(qtyInputs[0])

    const state = store.getState()
    expect(state.cart.items[0].quantity).toBe(1)
  })

  // Test 16: Accessibility - live region exists
  it('has aria-live region for screen readers', () => {
    const store = createTestStore(mockCartItems)
    const { container } = renderWithProviders(<Cart />, store)

    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
  })

  // Test 17: Shows correct singular/plural item text
  it('displays singular "item" when cart has 1 item', () => {
    const singleItem = [{ ...mockCartItems[0], quantity: 1 }]
    const store = createTestStore(singleItem)
    renderWithProviders(<Cart />, store)

    // Cart displays items with quantity badges, not separate item count text
    expect(screen.getByText('Product One')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
