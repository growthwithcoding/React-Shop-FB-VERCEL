// src/app/store.js
// ------------------------------------------------------------
// WHAT THIS DOES:
// Sets up the Redux store, hydrates the cart & ui from sessionStorage (if present),
// and exposes a safe subscription to persist cart/ui changes without breaking the app.
// ------------------------------------------------------------

import { configureStore } from '@reduxjs/toolkit'
import cartReducer from '../features/cart/cartSlice.js'
import uiReducer from '../features/ui/uiSlice.js'

// Storage keys live here so ESLint doesn't bark about no-undef.
// Version the keys so future schema tweaks don't collide with old data.
export const STORAGE_KEY = 'ADVSHOP_CART_FB_V1'     // cart slice
export const STORAGE_KEY_UI = 'ADVSHOP_UI_FB_V1'    // ui slice

// ------------------------------------------------------------
// HYDRATION (a.k.a. "load slices from sessionStorage if available")
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
    // Persistence is optional; app still works without it.
    // Touch the error so lint knows we ignored it intentionally.
    void err
  }
  return undefined
}

function readUIFromSession() {
  // Same story as cart: read gently, validate, and fall back gracefully.
  try {
    const raw = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(STORAGE_KEY_UI)
      : null
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    // Basic sanity check: expect an object-ish slice
    if (parsed && typeof parsed === 'object') return parsed
  } catch (err) {
    // Optional persistence; do not explode if something is off.
    void err
  }
  return undefined
}

const preloadedCart = readCartFromSession()
const preloadedUI = readUIFromSession()

// ------------------------------------------------------------
// STORE (reducers + optional preloaded slices)
// ------------------------------------------------------------
export const store = configureStore({
  reducer: {
    cart: cartReducer,
    ui: uiReducer
  },
  // Only provide preloadedState when we actually have slices to hydrate.
  preloadedState:
    preloadedCart || preloadedUI
      ? {
          ...(preloadedCart ? { cart: preloadedCart } : {}),
          ...(preloadedUI ? { ui: preloadedUI } : {})
        }
      : undefined,
  devTools: true
})

// ------------------------------------------------------------
// PERSISTENCE (subscribe → write cart/ui slices to sessionStorage)
// Call this once from your app entry (e.g., main.jsx) after creating the store:
//    import { store, persistStateSubscription } from './app/store.js'
//    persistStateSubscription(store)
// ------------------------------------------------------------
export function persistStateSubscription(storeInstance) {
  // Persist the Redux slices to sessionStorage on every state change.
  // If storage is unavailable or quota is exceeded, we swallow the error.
  storeInstance.subscribe(() => {
    const state = storeInstance.getState()
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart))
        sessionStorage.setItem(STORAGE_KEY_UI, JSON.stringify(state.ui))
      }
    } catch (err) {
      // Not empty on purpose (satisfies no-empty). Persistence is best-effort.
      // We don't console.* to avoid noisy CI, but we acknowledge the error:
      void err
    }
  })
}