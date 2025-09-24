import { createSlice } from '@reduxjs/toolkit'

const initialState = { items: [] } // [{id,title,price,image,quantity}]

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action) {
      const p = action.payload
      const existing = state.items.find(i => i.id === p.id)
      const q = Math.max(1, Number(p.quantity || 1))
      if (existing) existing.quantity += q
      else state.items.push({ id: p.id, title: p.title, price: p.price, image: p.image, quantity: q })
    },
    removeItem(state, action) {
      const id = action.payload
      state.items = state.items.filter(i => i.id !== id)
    },
    setQuantity(state, action) {
      const { id, quantity } = action.payload
      const item = state.items.find(i => i.id === id)
      if (!item) return
      if (quantity <= 0) {
        state.items = state.items.filter(i => i.id !== id)
      } else {
        item.quantity = quantity
      }
    },
    clear(state) {
      state.items = []
    },
  },
})

export const { addItem, removeItem, setQuantity, clear } = cartSlice.actions
export default cartSlice.reducer
