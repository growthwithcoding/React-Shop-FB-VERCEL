// src/services/addressService.js
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";

const getCol = () => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, "addresses");
};

export async function getAddresses(userId, { type } = {}) {
  if (!userId) return [];
  const col = getCol();
  console.log("addressService.getAddresses - userId:", userId);
  console.log("addressService.getAddresses - type filter:", type);
  const filters = [where("userId", "==", userId)];
  if (type) filters.push(where("type", "==", type));
  // Removed orderBy to avoid composite index requirement - addresses don't need strict ordering
  const q = query(col, ...filters);
  const snap = await getDocs(q);
  console.log("addressService.getAddresses - Found docs:", snap.size);
  const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log("addressService.getAddresses - Results:", results);
  return results;
}

export async function getAddressById(id) {
  if (!id) return null;
  const ref = doc(db, "addresses", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createAddress(userId, data) {
  if (!userId) throw new Error("createAddress requires userId");
  const col = getCol();
  const now = serverTimestamp();
  const payload = {
    userId,
    type: data?.type === "billing" || data?.type === "shipping" ? data.type : "other",
    line1: data?.line1 || "",
    line2: data?.line2 || "",
    city: data?.city || "",
    state: data?.state || "",
    postalCode: data?.postalCode || "",
    country: data?.country || "US",
    isDefault: !!data?.isDefault,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(col, payload);
  const snap = await getDoc(ref);
  return { id: ref.id, ...(snap.data() || payload) };
}

export async function updateAddress({ id, ...patch }) {
  if (!id) throw new Error("updateAddress requires id");
  const ref = doc(db, "addresses", id);
  const next = { ...patch, updatedAt: serverTimestamp() };
  await updateDoc(ref, next);
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
}

export async function deleteAddress(id) {
  if (!id) throw new Error("deleteAddress requires id");
  await deleteDoc(doc(db, "addresses", id));
  return { id };
}

export async function getDefaultAddress(userId, type) {
  const rows = await getAddresses(userId, { type });
  return rows.find((a) => a.isDefault) || rows[0] || null;
}

export async function setDefaultAddress(userId, id, type) {
  const rows = await getAddresses(userId, { type });
  await Promise.all(
    rows.map((a) =>
      updateDoc(doc(db, "addresses", a.id), {
        isDefault: a.id === id,
        updatedAt: serverTimestamp(),
      })
    )
  );
}
