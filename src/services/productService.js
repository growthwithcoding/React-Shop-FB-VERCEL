// src/services/productService.js
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db, firebaseInitialized } from '../lib/firebase'

// Helper to get the collection reference (delayed evaluation)
const getCol = () => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, 'products');
};

/**
 * List all products.
 */
export async function listProducts({ take } = {}) {
  const col = getCol();
  // Support optional limit, default unlimited (for back-compat)
  let q = col;
  if (take) q = query(col, orderBy('createdAt', 'desc'), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    // Map priceUSD to price, imageUrl to image, and handle inventory/stock field naming
    return { 
      id: d.id, 
      ...data,
      price: data.priceUSD ?? data.price ?? 0,
      image: data.imageUrl ?? '',
      inventory: data.inventory ?? data.stock ?? 0,
      status: data.status ?? (data.inventory > 0 || data.stock > 0 ? 'active' : 'inactive')
    };
  });
}

/**
 * Get a single product by ID (throws if not found).
 */
export async function getProductById(id) {
  const ref = doc(db, 'products', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Product not found')
  const data = snap.data();
  // Map priceUSD to price, imageUrl to image, and handle inventory/stock field naming
  return { 
    id: snap.id, 
    ...data,
    price: data.priceUSD ?? data.price ?? 0,
    image: data.imageUrl ?? '',
    inventory: data.inventory ?? data.stock ?? 0,
    status: data.status ?? (data.inventory > 0 || data.stock > 0 ? 'active' : 'inactive')
  };
}

/**
 * Create a new product document.
 */
export async function createProduct(data) {
  const col = getCol();
  const payload = {
    title: '',
    description: '',
    image: '',
    price: 0,
    category: 'general',
    rating: { rate: 0, count: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data
  }
  const ref = await addDoc(col, payload)
  return { id: ref.id, ...payload }
}

/**
 * Create or update a product document with a known id.
 */
export async function setProduct(id, data) {
  // Upsert (for admin bulk ops or migration)
  const ref = doc(db, 'products', id)
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, { ...payload }, { merge: true })
  return getProductById(id)
}

/**
 * Update product fields (patch).
 */
export async function updateProduct(id, data) {
  const ref = doc(db, 'products', id)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  return getProductById(id)
}

/**
 * Delete a product by ID.
 */
export async function deleteProduct(id) {
  const ref = doc(db, 'products', id)
  await deleteDoc(ref)
  return { id }
}

/**
 * Get all products in a category.
 */
export async function getProductsByCategory(category) {
  const all = await listProducts()
  const normalizedCategory = (category || 'general').toLowerCase()
  return all.filter(p => {
    const productCategory = (p.category || 'general').toLowerCase()
    return productCategory === normalizedCategory
  })
}

/**
 * Get all unique product categories.
 */
export async function getCategories() {
  try {
    const all = await listProducts();
    if (!Array.isArray(all) || all.length === 0) return [];
    const set = new Set(all.map(p => p.category ?? "general"));
    return Array.from(set).sort();
  } catch (e) {
    console.error("getCategories failed:", e);
    return [];
  }
}

/**
 * Prettify a category label.
 */
export function categoryLabel(cat) {
  const s = (cat ?? "general").toString();
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// Back-compat aliases
export { listProducts as getAllProducts };

/**
 * Get product by id, or null if not found (safe).
 */
export async function getProduct(id) {
  try {
    return await getProductById(id);
  } catch (e) {
    console.warn('getProductById failed, returning null', e);
    return null;
  }
}
