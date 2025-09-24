export const selectCartItems = (state) => state.cart.items

export const selectTotalCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0)

export const selectTotalPrice = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity * Number(i.price || 0), 0)
