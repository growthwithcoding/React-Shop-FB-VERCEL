// src/app/store.js
// ------------------------------------------------------------
// WHAT THIS DOES:
// Sets up the Redux store, hydrates the cart from sessionStorage (if present),
// and exposes a safe subscription to persist cart changes without breaking the app.
// ------------------------------------------------------------

import { configureStore } from '@reduxjs/toolkit'
import cartReducer from '../features/cart/cartSlice.js'
import uiReducer from '../features/ui/uiSlice.js'


// ---- sessionStorage persistence helpers (auto‑injected) ----
const loadState = () => {
  try {
    const saved = sessionStorage.getItem('cart')
    return saved ? { cart: JSON.parse(saved) } : undefined
  } catch (e) { return undefined }
}

// Storage key lives here so ESLint doesn't bark about no-undef.
// Version the key so future schema tweaks don't collide with old data.
export const STORAGE_KEY = 'ADVSHOP_CART_V1'

// ------------------------------------------------------------
// HYDRATION (a.k.a. "load cart from sessionStorage if available")
// ------------------------------------------------------------
function readCartFromSession() {
  // sessionStorage can be unavailable (private mode) or contain junk.
  // We try politely, and if anything smells off, we bail gracefully.
  try {
    const raw = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(STORAGE_KEY)
      : null
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    // Basic sanity check: expect an object-ish slice
    if (parsed && typeof parsed === 'object') return parsed
  } catch (err) {
    // Not empty: persistence is optional; app still works without it.
    // Touch the error so lint knows we ignored it intentionally.
    void err
  }
  return undefined
}

const preloadedCart = readCartFromSession()

// ------------------------------------------------------------
// STORE (reducers + optional preloaded cart)
// ------------------------------------------------------------
export const store = configureStore({
  reducer: {
    cart: cartReducer,
    ui: uiReducer
  },
  // Only provide preloadedState when we actually have a cart to hydrate.
  preloadedState: preloadedCart ? { cart: preloadedCart } : undefined,
  devTools: true
})

// ------------------------------------------------------------
// PERSISTENCE (subscribe → write cart slice to sessionStorage)
// Call this once from your app entry (e.g., main.jsx) after creating the store:
//    import { store, persistCartSubscription } from './app/store.js'
//    persistCartSubscription(store)
// ------------------------------------------------------------
export function persistCartSubscription(storeInstance) {
  // Persist the Redux cart slice to sessionStorage on every state change.
  // If storage is unavailable or quota is exceeded, we swallow the error.
  storeInstance.subscribe(() => {
    const state = storeInstance.getState()
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart))
      }
    } catch (err) {
      // Not empty on purpose (satisfies no-empty). Persistence is best-effort.
      // We don't console.* to avoid noisy CI, but we acknowledge the error:
      void err
    }
  })
}

// ---- persist cart to sessionStorage on change (auto‑injected) ----
try {
  store.subscribe(() => {
    const state = store.getState()
    sessionStorage.setItem('cart', JSON.stringify(state.cart))
  })
} catch (e) { /* ignore write errors */ }
