import { describe, it, expect } from 'vitest'
import cartReducer, { addItem, removeItem, setQuantity, clear } from '../cartSlice'

describe('cartSlice - Redux State Tests', () => {
  const initialState = { items: [] }

  // Test 1: Initial state
  it('returns initial state when state is undefined', () => {
    const state = cartReducer(undefined, { type: 'unknown' })
    expect(state).toEqual({ items: [] })
  })

  // Test 2: addItem - adds new item to empty cart
  it('adds a new item to empty cart', () => {
    const newItem = {
      id: '1',
      title: 'Test Product',
      price: 29.99,
      image: 'test.jpg',
      quantity: 1,
    }

    const state = cartReducer(initialState, addItem(newItem))

    expect(state.items).toHaveLength(1)
    expect(state.items[0]).toEqual(newItem)
  })

  // Test 3: addItem - adds multiple different items
  it('adds multiple different items', () => {
    let state = initialState

    state = cartReducer(state, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
      quantity: 1,
    }))

    state = cartReducer(state, addItem({
      id: '2',
      title: 'Product 2',
      price: 20,
      image: 'img2.jpg',
      quantity: 1,
    }))

    expect(state.items).toHaveLength(2)
    expect(state.items[0].id).toBe('1')
    expect(state.items[1].id).toBe('2')
  })

  // Test 4: addItem - increments quantity for existing item
  it('increments quantity when adding existing item', () => {
    let state = {
      items: [{
        id: '1',
        title: 'Product 1',
        price: 10,
        image: 'img1.jpg',
        quantity: 2,
      }],
    }

    state = cartReducer(state, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
      quantity: 3,
    }))

    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(5) // 2 + 3
  })

  // Test 5: addItem - defaults to quantity 1 if not provided
  it('defaults to quantity 1 when quantity is not provided', () => {
    const state = cartReducer(initialState, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
    }))

    expect(state.items[0].quantity).toBe(1)
  })

  // Test 6: addItem - handles quantity of 0 by setting to 1
  it('sets quantity to 1 when 0 is provided', () => {
    const state = cartReducer(initialState, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
      quantity: 0,
    }))

    expect(state.items[0].quantity).toBe(1)
  })

  // Test 7: addItem - handles negative quantity by setting to 1
  it('sets quantity to 1 when negative is provided', () => {
    const state = cartReducer(initialState, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
      quantity: -5,
    }))

    expect(state.items[0].quantity).toBe(1)
  })

  // Test 8: removeItem - removes item from cart
  it('removes item from cart', () => {
    const state = {
      items: [
        { id: '1', title: 'Product 1', price: 10, image: 'img1.jpg', quantity: 1 },
        { id: '2', title: 'Product 2', price: 20, image: 'img2.jpg', quantity: 1 },
      ],
    }

    const newState = cartReducer(state, removeItem('1'))

    expect(newState.items).toHaveLength(1)
    expect(newState.items[0].id).toBe('2')
  })

  // Test 9: removeItem - handles removing non-existent item
  it('handles removing non-existent item gracefully', () => {
    const state = {
      items: [
        { id: '1', title: 'Product 1', price: 10, image: 'img1.jpg', quantity: 1 },
      ],
    }

    const newState = cartReducer(state, removeItem('999'))

    expect(newState.items).toHaveLength(1)
    expect(newState.items[0].id).toBe('1')
  })

  // Test 10: setQuantity - updates item quantity
  it('updates item quantity', () => {
    const state = {
      items: [
        { id: '1', title: 'Product 1', price: 10, image: 'img1.jpg', quantity: 1 },
      ],
    }

    const newState = cartReducer(state, setQuantity({ id: '1', quantity: 5 }))

    expect(newState.items[0].quantity).toBe(5)
  })

  // Test 11: setQuantity - removes item when quantity is 0
  it('removes item when quantity is set to 0', () => {
    const state = {
      items: [
        { id: '1', title: 'Product 1', price: 10, image: 'img1.jpg', quantity: 3 },
        { id: '2', title: 'Product 2', price: 20, image: 'img2.jpg', quantity: 2 },
      ],
    }

    const newState = cartReducer(state, setQuantity({ id: '1', quantity: 0 }))

    expect(newState.items).toHaveLength(1)
    expect(newState.items[0].id).toBe('2')
  })

  // Test 12: setQuantity - removes item when quantity is negative
  it('removes item when quantity is negative', () => {
    const state = {
      items: [
        { id: '1', title: 'Product 1', price: 10, image: 'img1.jpg', quantity: 3 },
      ],
    }

    const newState = cartReducer(state, setQuantity({ id: '1', quantity: -1 }))

    expect(newState.items).toHaveLength(0)
  })

  // Test 13: setQuantity - does nothing for non-existent item
  it('does nothing when setting quantity for non-existent item', () => {
    const state = {
      items: [
        { id: '1', title: 'Product 1', price: 10, image: 'img1.jpg', quantity: 1 },
      ],
    }

    const newState = cartReducer(state, setQuantity({ id: '999', quantity: 5 }))

    expect(newState.items).toHaveLength(1)
    expect(newState.items[0].quantity).toBe(1) // Unchanged
  })

  // Test 14: clear - empties the cart
  it('clears all items from cart', () => {
    const state = {
      items: [
        { id: '1', title: 'Product 1', price: 10, image: 'img1.jpg', quantity: 1 },
        { id: '2', title: 'Product 2', price: 20, image: 'img2.jpg', quantity: 2 },
        { id: '3', title: 'Product 3', price: 30, image: 'img3.jpg', quantity: 3 },
      ],
    }

    const newState = cartReducer(state, clear())

    expect(newState.items).toHaveLength(0)
    expect(newState.items).toEqual([])
  })

  // Test 15: clear - works on already empty cart
  it('clears empty cart without errors', () => {
    const newState = cartReducer(initialState, clear())

    expect(newState.items).toHaveLength(0)
    expect(newState.items).toEqual([])
  })

  // Test 16: addItem with string quantity
  it('handles string quantity by converting to number', () => {
    const state = cartReducer(initialState, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
      quantity: '5',
    }))

    expect(state.items[0].quantity).toBe(5)
  })

  // Test 17: Multiple operations in sequence
  it('handles multiple operations correctly', () => {
    let state = initialState

    // Add item
    state = cartReducer(state, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
      quantity: 2,
    }))

    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(2)

    // Update quantity
    state = cartReducer(state, setQuantity({ id: '1', quantity: 5 }))
    expect(state.items[0].quantity).toBe(5)

    // Add more of same item
    state = cartReducer(state, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
      quantity: 3,
    }))
    expect(state.items[0].quantity).toBe(8) // 5 + 3

    // Add different item
    state = cartReducer(state, addItem({
      id: '2',
      title: 'Product 2',
      price: 20,
      image: 'img2.jpg',
      quantity: 1,
    }))
    expect(state.items).toHaveLength(2)

    // Remove first item
    state = cartReducer(state, removeItem('1'))
    expect(state.items).toHaveLength(1)
    expect(state.items[0].id).toBe('2')

    // Clear cart
    state = cartReducer(state, clear())
    expect(state.items).toHaveLength(0)
  })

  // Test 18: State immutability
  it('does not mutate original state', () => {
    const state = {
      items: [
        { id: '1', title: 'Product 1', price: 10, image: 'img1.jpg', quantity: 1 },
      ],
    }

    const originalItemsLength = state.items.length
    const originalQuantity = state.items[0].quantity

    cartReducer(state, addItem({
      id: '2',
      title: 'Product 2',
      price: 20,
      image: 'img2.jpg',
      quantity: 1,
    }))

    // Original state should be unchanged
    expect(state.items).toHaveLength(originalItemsLength)
    expect(state.items[0].quantity).toBe(originalQuantity)
  })

  // Test 19: Preserves other item properties
  it('preserves all item properties', () => {
    const item = {
      id: '1',
      title: 'Product 1',
      price: 10.99,
      image: 'https://example.com/image.jpg',
      quantity: 1,
    }

    const state = cartReducer(initialState, addItem(item))

    expect(state.items[0]).toEqual(item)
    expect(state.items[0].title).toBe('Product 1')
    expect(state.items[0].price).toBe(10.99)
    expect(state.items[0].image).toBe('https://example.com/image.jpg')
  })

  // Test 20: Edge case - large quantity
  it('handles large quantities', () => {
    const state = cartReducer(initialState, addItem({
      id: '1',
      title: 'Product 1',
      price: 10,
      image: 'img1.jpg',
      quantity: 1000,
    }))

    expect(state.items[0].quantity).toBe(1000)
  })
})
