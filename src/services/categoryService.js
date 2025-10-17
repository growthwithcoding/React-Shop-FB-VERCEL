// src/services/categoryService.js
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db, firebaseInitialized } from '../lib/firebase'

// Helper to get the collection reference
const getCol = () => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, 'categories');
};

/**
 * List all categories.
 */
export async function listCategories() {
  try {
    const col = getCol();
    const q = query(col, orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  } catch (e) {
    console.error("listCategories failed:", e);
    return [];
  }
}

/**
 * Get a single category by ID.
 */
export async function getCategoryById(id) {
  const ref = doc(db, 'categories', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Category not found');
  return { id: snap.id, ...snap.data() };
}

/**
 * Create a new category.
 */
export async function createCategory(data) {
  const col = getCol();
  const payload = {
    name: data.name || '',
    description: data.description || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(col, payload);
  return { id: ref.id, ...payload };
}

/**
 * Update a category.
 */
export async function updateCategory(id, data) {
  const ref = doc(db, 'categories', id);
  await updateDoc(ref, { 
    ...data, 
    updatedAt: serverTimestamp() 
  });
  return getCategoryById(id);
}

/**
 * Delete a category.
 */
export async function deleteCategory(id) {
  const ref = doc(db, 'categories', id);
  await deleteDoc(ref);
  return { id };
}

/**
 * Get all unique categories from products (fallback if categories collection is empty).
 */
export async function getCategoriesFromProducts() {
  try {
    const productsRef = collection(db, 'products');
    const snap = await getDocs(productsRef);
    const categorySet = new Set();
    
    snap.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        categorySet.add(category);
      }
    });
    
    return Array.from(categorySet).sort().map(name => ({ name }));
  } catch (e) {
    console.error("getCategoriesFromProducts failed:", e);
    return [];
  }
}

/**
 * Sync categories from products to categories collection.
 * This is useful for initial setup.
 */
export async function syncCategoriesFromProducts() {
  try {
    const productCategories = await getCategoriesFromProducts();
    const existingCategories = await listCategories();
    const existingNames = new Set(existingCategories.map(c => c.name));
    
    const promises = productCategories
      .filter(pc => !existingNames.has(pc.name))
      .map(pc => createCategory({ name: pc.name, description: '' }));
    
    await Promise.all(promises);
    return await listCategories();
  } catch (e) {
    console.error("syncCategoriesFromProducts failed:", e);
    throw e;
  }
}
