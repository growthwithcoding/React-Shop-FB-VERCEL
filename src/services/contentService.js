// src/services/contentService.js
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";

// --------- SPECIAL CONTENT: HERO ---------
export async function getHeroContent() {
  try {
    const snap = await getDoc(doc(db, "config", "hero"));
    if (!snap.exists()) {
      return {
        homeKicker: null,
        homeHeadline: null,
        categoryPrefix: null,
      };
    }
    const d = snap.data() || {};
    return {
      homeKicker: d.homeKicker ?? null,
      homeHeadline: d.homeHeadline ?? null,
      categoryPrefix: d.categoryPrefix ?? null,
    };
  } catch (e) {
    console.warn("getHeroContent failed:", e);
    return {
      homeKicker: null,
      homeHeadline: null,
      categoryPrefix: null,
    };
  }
}

// --------- SPECIAL CONTENT: PROMOS ---------
export async function getPromos() {
  try {
    const snap = await getDoc(doc(db, "config", "promos"));
    if (!snap.exists()) return [];
    const d = snap.data() || {};
    return Array.isArray(d.promos) ? d.promos : [];
  } catch (e) {
    console.warn("getPromos failed:", e);
    return [];
  }
}

// --------- CRUD FOR GENERAL CONTENT DOCS ---------
const getCol = () => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, 'content');
};

/**
 * List content docs (with optional limit).
 */
export async function listContent({ take = 50 } = {}) {
  const col = getCol();
  const q = query(col, orderBy('createdAt', 'desc'), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get a content doc by id.
 */
export async function getContentById(id) {
  const ref = doc(db, 'content', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Content not found');
  return { id: snap.id, ...snap.data() };
}

/**
 * Create a content doc.
 */
export async function createContent(data) {
  const col = getCol();
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(col, payload);
  return { id: ref.id, ...payload };
}

/**
 * Update content doc.
 */
export async function updateContent(id, patch) {
  const ref = doc(db, 'content', id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  return getContentById(id);
}

/**
 * Delete content doc.
 */
export async function deleteContent(id) {
  const ref = doc(db, 'content', id);
  await deleteDoc(ref);
  return { id };
}
