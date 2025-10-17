// src/services/orderService.js
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";

// Helper functions for collection/doc references (delayed evaluation)
const getOrdersCol = () => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, "orders");
};

const addrDoc = (id) => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return doc(db, "addresses", id);
};

const userDoc = (id) => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return doc(db, "users", id);
};

function toAddressSnapshot(a, user) {
  if (!a) return null;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return {
    fullName: fullName || undefined, // optional convenience
    line1: a.line1 || "",
    line2: a.line2 || "",
    city: a.city || "",
    state: a.state || "",
    postalCode: a.postalCode || "",
    country: a.country || "US",
    type: a.type || "other",
  };
}

/**
 * Create a new order (user-level).
 * Accepts address IDs and snapshots the address docs at purchase time.
 */
export async function createOrder({
  userId,
  items,
  subtotal,
  delivery,
  discount,
  total,
  shippingAddressId = null,
  billingAddressId = null,
}) {
  const userSnap = await getDoc(userDoc(userId));
  const user = userSnap.exists() ? userSnap.data() : null;

  const [shipSnap, billSnap] = await Promise.all([
    shippingAddressId ? getDoc(addrDoc(shippingAddressId)) : null,
    billingAddressId ? getDoc(addrDoc(billingAddressId)) : null,
  ]);

  const shipping = shipSnap?.exists() ? { id: shipSnap.id, ...shipSnap.data() } : null;
  const billing = billSnap?.exists() ? { id: billSnap.id, ...billSnap.data() } : null;

  const payload = {
    userId,
    items,
    subtotal,
    delivery,
    discount,
    total,
    shippingAddressId: shipping ? shipping.id : null,
    billingAddressId: billing ? billing.id : null,
    shippingAddressSnapshot: toAddressSnapshot(shipping, user),
    billingAddressSnapshot: toAddressSnapshot(billing, user),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "pending",
  };

  const ref = await addDoc(getOrdersCol(), payload);
  return { id: ref.id, ...payload };
}

/** List orders for a user (most recent first). */
export async function listOrdersForUser(userId, { take = 50 } = {}) {
  const ordersCol = getOrdersCol();
  console.log("orderService.listOrdersForUser - userId:", userId);
  // Removed orderBy to avoid composite index requirement
  const qy = query(ordersCol, where("userId", "==", userId), limit(take));
  const snap = await getDocs(qy);
  console.log("orderService.listOrdersForUser - Found docs:", snap.size);
  const results = snap.docs.map((d) => {
    const data = d.data();
    // Map field names from seeded data to expected format
    return {
      id: d.id,
      ...data,
      // Map totalUSD -> total (and fallback to existing total)
      total: data.total ?? data.totalUSD ?? 0,
      subtotal: data.subtotal ?? data.subtotalUSD ?? 0,
      tax: data.tax ?? data.taxUSD ?? 0,
      delivery: data.delivery ?? data.shippingUSD ?? 0,
      // Use status field or fallback to paymentStatus
      status: data.status ?? data.paymentStatus ?? "pending",
      paymentStatus: data.paymentStatus ?? data.status ?? "pending",
    };
  });
  // Sort in memory by createdAt (newest first)
  results.sort((a, b) => {
    const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
    const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
    return bTime - aTime;
  });
  return results;
}

/** Get order by ID (throws if not found). */
export async function getOrderById(orderId) {
  const ref = doc(db, "orders", orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Order not found");
  const data = snap.data();
  // Map field names from seeded data to expected format
  return {
    id: snap.id,
    ...data,
    // Map totalUSD -> total (and fallback to existing total)
    total: data.total ?? data.totalUSD ?? 0,
    subtotal: data.subtotal ?? data.subtotalUSD ?? 0,
    tax: data.tax ?? data.taxUSD ?? 0,
    delivery: data.delivery ?? data.shippingUSD ?? 0,
    // Use status field or fallback to paymentStatus
    status: data.status ?? data.paymentStatus ?? "pending",
    paymentStatus: data.paymentStatus ?? data.status ?? "pending",
  };
}

// ---------- CRUD for general admin/order management -----------

/** List all orders (admin/global view). */
export async function listOrders({ take = 50 } = {}) {
  const ordersCol = getOrdersCol();
  const qy = query(ordersCol, orderBy("createdAt", "desc"), limit(take));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => {
    const data = d.data();
    // Map field names from seeded data to expected format
    return {
      id: d.id,
      ...data,
      // Map totalUSD -> total (and fallback to existing total)
      total: data.total ?? data.totalUSD ?? 0,
      subtotal: data.subtotal ?? data.subtotalUSD ?? 0,
      tax: data.tax ?? data.taxUSD ?? 0,
      delivery: data.delivery ?? data.shippingUSD ?? 0,
      // Use status field or fallback to paymentStatus
      status: data.status ?? data.paymentStatus ?? "pending",
      paymentStatus: data.paymentStatus ?? data.status ?? "pending",
    };
  });
}

/** Create or update an order by ID (admin bulk/migration). */
export async function setOrder(id, data) {
  const ref = doc(db, "orders", id);
  const payload = { ...data, updatedAt: serverTimestamp() };
  await setDoc(ref, payload, { merge: true });
  return getOrderById(id);
}

/** Update an order. */
export async function updateOrder(id, patch) {
  const ref = doc(db, "orders", id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  return getOrderById(id);
}

/** Delete an order by ID. */
export async function deleteOrder(id) {
  const ref = doc(db, "orders", id);
  await deleteDoc(ref);
  return { id };
}

/**
 * Create a new order from admin panel (without requiring address IDs).
 * This is used when admins manually create orders.
 */
export async function createOrderFromAdmin({
  userId,
  items,
  subtotal,
  shipping,
  total,
  paymentStatus = "pending",
  fulfillmentStatus = "unfulfilled",
  shippingMethod = "standard",
  notes = "",
}) {
  const payload = {
    userId,
    items,
    subtotal,
    delivery: shipping,
    discount: 0,
    total,
    paymentStatus,
    fulfillmentStatus,
    shippingMethod,
    notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: paymentStatus, // For backward compatibility
    // Leave address fields null since this is an admin-created order
    shippingAddressId: null,
    billingAddressId: null,
    shippingAddressSnapshot: null,
    billingAddressSnapshot: null,
  };

  const ref = await addDoc(getOrdersCol(), payload);
  return { id: ref.id, ...payload };
}
