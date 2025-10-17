import { describe, it, expect } from 'vitest'
import uiReducer, { showAddModal, hideAddModal } from '../uiSlice'

describe('uiSlice - Redux State Tests', () => {
  const initialState = { addModalOpen: false, lastAdded: null }

  // Test 1: Initial state
  it('returns initial state when state is undefined', () => {
    const state = uiReducer(undefined, { type: 'unknown' })
    expect(state).toEqual({ addModalOpen: false, lastAdded: null })
  })

  // Test 2: showAddModal - opens modal and sets lastAdded
  it('opens modal and sets lastAdded data', () => {
    const productData = {
      title: 'Test Product',
      image: 'test.jpg',
      quantity: 2,
      price: 29.99,
    }

    const state = uiReducer(initialState, showAddModal(productData))

    expect(state.addModalOpen).toBe(true)
    expect(state.lastAdded).toEqual(productData)
  })

  // Test 3: showAddModal - updates lastAdded with new product
  it('updates lastAdded when showing modal again', () => {
    const firstProduct = {
      title: 'First Product',
      image: 'first.jpg',
      quantity: 1,
      price: 19.99,
    }

    const secondProduct = {
      title: 'Second Product',
      image: 'second.jpg',
      quantity: 3,
      price: 39.99,
    }

    let state = uiReducer(initialState, showAddModal(firstProduct))
    expect(state.lastAdded).toEqual(firstProduct)

    state = uiReducer(state, showAddModal(secondProduct))
    expect(state.lastAdded).toEqual(secondProduct)
    expect(state.addModalOpen).toBe(true)
  })

  // Test 4: hideAddModal - closes modal and clears lastAdded
  it('closes modal and clears lastAdded data', () => {
    const stateWithModal = {
      addModalOpen: true,
      lastAdded: {
        title: 'Test Product',
        image: 'test.jpg',
        quantity: 2,
        price: 29.99,
      },
    }

    const state = uiReducer(stateWithModal, hideAddModal())

    expect(state.addModalOpen).toBe(false)
    expect(state.lastAdded).toBeNull()
  })

  // Test 5: hideAddModal - works when modal already closed
  it('handles hiding already closed modal', () => {
    const state = uiReducer(initialState, hideAddModal())

    expect(state.addModalOpen).toBe(false)
    expect(state.lastAdded).toBeNull()
  })

  // Test 6: showAddModal then hideAddModal sequence
  it('handles show then hide sequence correctly', () => {
    const productData = {
      title: 'Test Product',
      image: 'test.jpg',
      quantity: 1,
      price: 49.99,
    }

    // Show modal
    let state = uiReducer(initialState, showAddModal(productData))
    expect(state.addModalOpen).toBe(true)
    expect(state.lastAdded).toEqual(productData)

    // Hide modal
    state = uiReducer(state, hideAddModal())
    expect(state.addModalOpen).toBe(false)
    expect(state.lastAdded).toBeNull()
  })

  // Test 7: Multiple show/hide cycles
  it('handles multiple show/hide cycles', () => {
    const product1 = { title: 'Product 1', image: 'img1.jpg', quantity: 1, price: 10 }
    const product2 = { title: 'Product 2', image: 'img2.jpg', quantity: 2, price: 20 }

    let state = initialState

    // Cycle 1
    state = uiReducer(state, showAddModal(product1))
    expect(state.addModalOpen).toBe(true)
    expect(state.lastAdded).toEqual(product1)

    state = uiReducer(state, hideAddModal())
    expect(state.addModalOpen).toBe(false)
    expect(state.lastAdded).toBeNull()

    // Cycle 2
    state = uiReducer(state, showAddModal(product2))
    expect(state.addModalOpen).toBe(true)
    expect(state.lastAdded).toEqual(product2)

    state = uiReducer(state, hideAddModal())
    expect(state.addModalOpen).toBe(false)
    expect(state.lastAdded).toBeNull()
  })

  // Test 8: showAddModal with minimal data
  it('handles showAddModal with minimal product data', () => {
    const minimalData = {
      title: 'Product',
    }

    const state = uiReducer(initialState, showAddModal(minimalData))

    expect(state.addModalOpen).toBe(true)
    expect(state.lastAdded).toEqual(minimalData)
  })

  // Test 9: showAddModal with complete data
  it('handles showAddModal with complete product data', () => {
    const completeData = {
      title: 'Complete Product',
      image: 'https://example.com/image.jpg',
      quantity: 5,
      price: 99.99,
      extraField: 'extra',
    }

    const state = uiReducer(initialState, showAddModal(completeData))

    expect(state.addModalOpen).toBe(true)
    expect(state.lastAdded).toEqual(completeData)
  })

  // Test 10: State immutability
  it('does not mutate original state', () => {
    const originalState = { ...initialState }

    uiReducer(initialState, showAddModal({
      title: 'Test',
      image: 'test.jpg',
      quantity: 1,
      price: 10,
    }))

    expect(initialState).toEqual(originalState)
  })

  // Test 11: showAddModal preserves all payload properties
  it('preserves all properties in lastAdded', () => {
    const productData = {
      title: 'Wireless Headphones',
      image: 'https://example.com/headphones.jpg',
      quantity: 3,
      price: 79.99,
      category: 'Electronics',
      rating: 4.5,
    }

    const state = uiReducer(initialState, showAddModal(productData))

    expect(state.lastAdded).toEqual(productData)
    expect(state.lastAdded.title).toBe('Wireless Headphones')
    expect(state.lastAdded.quantity).toBe(3)
    expect(state.lastAdded.price).toBe(79.99)
    expect(state.lastAdded.category).toBe('Electronics')
    expect(state.lastAdded.rating).toBe(4.5)
  })

  // Test 12: hideAddModal always resets to initial state
  it('always resets to initial modal state when hiding', () => {
    const stateWithModal = {
      addModalOpen: true,
      lastAdded: {
        title: 'Some Product',
        image: 'some.jpg',
        quantity: 10,
        price: 199.99,
      },
    }

    const state = uiReducer(stateWithModal, hideAddModal())

    expect(state).toEqual(initialState)
  })
})
