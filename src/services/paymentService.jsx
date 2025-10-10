// src/services/paymentService.js
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
  return collection(db, "paymentMethods");
};

export async function getPaymentMethods(userId) {
  if (!userId) return [];
  console.log("paymentService.getPaymentMethods - userId:", userId);
  // Removed orderBy to avoid composite index requirement
  const col = getCol();
  const q = query(col, where("userId", "==", userId));
  const snap = await getDocs(q);
  console.log("paymentService.getPaymentMethods - Found docs:", snap.size);
  const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort in memory by createdAt (newest first)
  results.sort((a, b) => {
    const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
    const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
    return bTime - aTime;
  });
  console.log("paymentService.getPaymentMethods - Results:", results);
  return results;
}

export async function getPaymentMethodById(id) {
  if (!id) return null;
  const ref = doc(db, "paymentMethods", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createPaymentMethod(userId, data) {
  if (!userId) throw new Error("createPaymentMethod requires userId");
  const now = serverTimestamp();
  
  // Validate payment type
  const validTypes = ["card", "paypal", "apple_pay", "google_pay"];
  if (!validTypes.includes(data?.type)) {
    throw new Error("Invalid payment method type");
  }

  const payload = {
    userId,
    type: data.type,
    // Card details (only for card type)
    ...(data.type === "card" && {
      cardNumber: data?.cardNumber || "",
      cardholderName: data?.cardholderName || "",
      expiryMonth: data?.expiryMonth || "",
      expiryYear: data?.expiryYear || "",
      cardBrand: data?.cardBrand || "", // visa, mastercard, amex
      last4: data?.last4 || (data?.cardNumber || "").slice(-4),
    }),
    // PayPal details
    ...(data.type === "paypal" && {
      paypalEmail: data?.paypalEmail || "",
    }),
    // Apple Pay / Google Pay (just need to track it's enabled)
    ...(["apple_pay", "google_pay"].includes(data.type) && {
      deviceId: data?.deviceId || "",
    }),
    isDefault: !!data?.isDefault,
    createdAt: now,
    updatedAt: now,
  };
  
  const col = getCol();
  const ref = await addDoc(col, payload);
  const snap = await getDoc(ref);
  return { id: ref.id, ...(snap.data() || payload) };
}

export async function updatePaymentMethod({ id, ...patch }) {
  if (!id) throw new Error("updatePaymentMethod requires id");
  const ref = doc(db, "paymentMethods", id);
  const next = { ...patch, updatedAt: serverTimestamp() };
  await updateDoc(ref, next);
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
}

export async function deletePaymentMethod(id) {
  if (!id) throw new Error("deletePaymentMethod requires id");
  await deleteDoc(doc(db, "paymentMethods", id));
  return { id };
}

export async function getDefaultPaymentMethod(userId) {
  const methods = await getPaymentMethods(userId);
  return methods.find((m) => m.isDefault) || methods[0] || null;
}

export async function setDefaultPaymentMethod(userId, id) {
  const methods = await getPaymentMethods(userId);
  await Promise.all(
    methods.map((m) =>
      updateDoc(doc(db, "paymentMethods", m.id), {
        isDefault: m.id === id,
        updatedAt: serverTimestamp(),
      })
    )
  );
}
