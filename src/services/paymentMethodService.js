// src/services/paymentMethodService.js
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Get user's saved payment methods
 */
export async function getUserPaymentMethods(userId) {
  if (!userId) return [];
  
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.paymentMethods || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return [];
  }
}

/**
 * Add a new payment method for user
 */
export async function addPaymentMethod(userId, paymentMethod) {
  if (!userId) throw new Error("User ID required");
  
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  
  // Get existing methods
  const existingMethods = userDoc.exists() ? (userDoc.data().paymentMethods || []) : [];
  
  // If this is set as default or it's the first method, unset other defaults
  if (paymentMethod.isDefault || existingMethods.length === 0) {
    const updatedMethods = existingMethods.map(m => ({ ...m, isDefault: false }));
    await updateDoc(userRef, { paymentMethods: updatedMethods });
  }
  
  // Add new method with generated ID
  const newMethod = {
    ...paymentMethod,
    id: `pm_${Date.now()}`,
    createdAt: new Date().toISOString(),
    isDefault: paymentMethod.isDefault || existingMethods.length === 0,
  };
  
  await updateDoc(userRef, {
    paymentMethods: arrayUnion(newMethod)
  });
  
  return newMethod;
}

/**
 * Remove a payment method
 */
export async function removePaymentMethod(userId, methodId) {
  if (!userId) throw new Error("User ID required");
  
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;
  
  const methods = userDoc.data().paymentMethods || [];
  const methodToRemove = methods.find(m => m.id === methodId);
  
  if (!methodToRemove) return;
  
  // Remove the method
  await updateDoc(userRef, {
    paymentMethods: arrayRemove(methodToRemove)
  });
  
  // If we removed the default, set another as default if available
  if (methodToRemove.isDefault) {
    const remainingMethods = methods.filter(m => m.id !== methodId);
    if (remainingMethods.length > 0) {
      const updatedMethods = remainingMethods.map((m, idx) => ({
        ...m,
        isDefault: idx === 0
      }));
      await updateDoc(userRef, { paymentMethods: updatedMethods });
    }
  }
}

/**
 * Set a payment method as default
 */
export async function setDefaultPaymentMethod(userId, methodId) {
  if (!userId) throw new Error("User ID required");
  
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;
  
  const methods = userDoc.data().paymentMethods || [];
  const updatedMethods = methods.map(m => ({
    ...m,
    isDefault: m.id === methodId
  }));
  
  await updateDoc(userRef, { paymentMethods: updatedMethods });
}
