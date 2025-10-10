import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";

/**
 * Firestore collection for discount codes.
 */
const getDiscountsCol = () => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, "discounts");
};

/**
 * List all discount codes.
 * Each returned object includes { id, code, type, value, isActive, stackable, scope, category, productId }.
 */
export async function listDiscounts() {
  const discountsCol = getDiscountsCol();
  const snap = await getDocs(discountsCol);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}

/**
 * Fetch a discount by its code (case‑insensitive) and ensure it is active.
 * Returns null if not found or not active.
 *
 * @param {string} code
 */
export async function getDiscountByCode(code) {
  if (!code) return null;
  const discountsCol = getDiscountsCol();
  const norm = (code || "").trim().toUpperCase();
  const q = query(discountsCol, where("code", "==", norm), where("isActive", "==", true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() || {}) };
}

/**
 * Convert Firestore Timestamp or date string to Date object
 * @param {*} dateValue - Firestore Timestamp, Date, or date string
 * @returns {Date|null}
 */
function toDate(dateValue) {
  if (!dateValue) return null;
  // Check if it's a Firestore Timestamp (has toDate method)
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  // Check if it's already a Date
  if (dateValue instanceof Date) {
    return dateValue;
  }
  // Try parsing as string
  return new Date(dateValue);
}

/**
 * Validate if a discount can be applied to a cart
 * @param {Object} discount - The discount to validate
 * @param {number} subtotal - Cart subtotal
 * @param {Array} cartItems - Cart items with { id, category, price, quantity }
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateDiscount(discount, subtotal, cartItems = []) {
  if (!discount || !discount.isActive) {
    return { valid: false, reason: "Discount is not active" };
  }

  // Check if discount has expired or not yet valid
  const now = new Date();
  const validFrom = toDate(discount.validFrom);
  const validUntil = toDate(discount.validUntil);
  
  if (validFrom && validFrom > now) {
    return { valid: false, reason: "Discount is not yet valid" };
  }
  if (validUntil && validUntil < now) {
    return { valid: false, reason: "Discount has expired" };
  }

  // Check usage limit
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return { valid: false, reason: "Discount usage limit reached" };
  }

  // Check minimum purchase requirement
  if (discount.minPurchaseUSD && subtotal < discount.minPurchaseUSD) {
    return { 
      valid: false, 
      reason: `Minimum purchase of $${discount.minPurchaseUSD} required` 
    };
  }

  // Validate scope-specific requirements
  if (discount.scope === "category" && discount.category) {
    const hasCategoryItem = cartItems.some(item => item.category === discount.category);
    if (!hasCategoryItem) {
      return { 
        valid: false, 
        reason: `Discount only applies to ${discount.category} items` 
      };
    }
  }

  if (discount.scope === "item" && discount.productId) {
    const hasProduct = cartItems.some(item => String(item.id) === String(discount.productId));
    if (!hasProduct) {
      return { 
        valid: false, 
        reason: "Discount only applies to specific product not in cart" 
      };
    }
  }

  return { valid: true, reason: "" };
}

/**
 * Calculate discount amount for a single discount
 * @param {Object} discount - The discount to calculate
 * @param {number} subtotal - Cart subtotal
 * @param {number} shippingCost - Shipping cost
 * @param {Array} cartItems - Cart items with { id, category, price, quantity }
 * @returns {number} Discount amount in dollars
 */
export function calculateDiscountAmount(discount, subtotal, shippingCost = 0, cartItems = []) {
  if (!discount || !discount.isActive) return 0;

  let amount = 0;

  // Calculate base amount based on discount type
  if (discount.type === "percentage") {
    // For category/item specific discounts, only apply to matching items
    if (discount.scope === "category" && discount.category) {
      const categoryTotal = cartItems
        .filter(item => item.category === discount.category)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      amount = categoryTotal * (discount.value / 100);
    } else if (discount.scope === "item" && discount.productId) {
      const productTotal = cartItems
        .filter(item => String(item.id) === String(discount.productId))
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      amount = productTotal * (discount.value / 100);
    } else {
      // Site-wide percentage discount
      amount = subtotal * (discount.value / 100);
    }
  } else if (discount.type === "fixed") {
    amount = discount.value;
  } else if (discount.type === "free_shipping") {
    amount = shippingCost;
  }

  // Apply maximum discount cap if specified
  if (discount.maxDiscountUSD && amount > discount.maxDiscountUSD) {
    amount = discount.maxDiscountUSD;
  }

  return amount;
}

/**
 * Apply multiple discounts to a cart, handling stacking rules
 * @param {Array} discounts - Array of discount objects to apply
 * @param {number} subtotal - Cart subtotal
 * @param {number} shippingCost - Shipping cost
 * @param {Array} cartItems - Cart items with { id, category, price, quantity }
 * @returns {Object} { totalDiscount, appliedDiscounts, errors }
 */
export function applyMultipleDiscounts(discounts, subtotal, shippingCost = 0, cartItems = []) {
  const appliedDiscounts = [];
  const errors = [];
  let totalDiscount = 0;
  let hasNonStackable = false;

  // Sort discounts: non-stackable first, then by value (highest first)
  const sortedDiscounts = [...discounts].sort((a, b) => {
    if (!a.stackable && b.stackable) return -1;
    if (a.stackable && !b.stackable) return 1;
    
    // Calculate estimated values for sorting
    const aValue = a.type === "percentage" ? subtotal * (a.value / 100) : a.value;
    const bValue = b.type === "percentage" ? subtotal * (b.value / 100) : b.value;
    return bValue - aValue;
  });

  for (const discount of sortedDiscounts) {
    // Check if we can apply this discount based on stacking rules
    if (hasNonStackable) {
      errors.push({
        code: discount.code,
        reason: "Cannot stack with non-stackable discount already applied"
      });
      continue;
    }

    // Validate the discount
    const validation = validateDiscount(discount, subtotal, cartItems);
    if (!validation.valid) {
      errors.push({
        code: discount.code,
        reason: validation.reason
      });
      continue;
    }

    // Calculate discount amount
    const amount = calculateDiscountAmount(discount, subtotal, shippingCost, cartItems);
    
    if (amount > 0) {
      appliedDiscounts.push({
        ...discount,
        appliedAmount: amount
      });
      totalDiscount += amount;

      // Mark if this is a non-stackable discount
      if (!discount.stackable) {
        hasNonStackable = true;
      }
    }
  }

  return {
    totalDiscount: Math.min(totalDiscount, subtotal + shippingCost), // Can't discount more than order total
    appliedDiscounts,
    errors
  };
}

/**
 * Save discount code to localStorage for auto-apply at checkout
 * @param {string} code - Discount code to save
 */
export function saveDiscountForCheckout(code) {
  if (!code) return;
  
  try {
    const saved = localStorage.getItem("savedDiscountCodes");
    const codes = saved ? JSON.parse(saved) : [];
    
    const normalizedCode = code.trim().toUpperCase();
    
    // Add code if not already saved (keep unique)
    if (!codes.includes(normalizedCode)) {
      codes.push(normalizedCode);
      localStorage.setItem("savedDiscountCodes", JSON.stringify(codes));
    }
  } catch (error) {
    console.error("Error saving discount code:", error);
  }
}

/**
 * Get saved discount codes from localStorage
 * @returns {Array} Array of saved discount codes
 */
export function getSavedDiscountCodes() {
  try {
    const saved = localStorage.getItem("savedDiscountCodes");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading saved discount codes:", error);
    return [];
  }
}

/**
 * Clear saved discount codes from localStorage
 */
export function clearSavedDiscountCodes() {
  try {
    localStorage.removeItem("savedDiscountCodes");
  } catch (error) {
    console.error("Error clearing saved discount codes:", error);
  }
}

/**
 * Remove a specific discount code from saved codes
 * @param {string} code - Code to remove
 */
export function removeSavedDiscountCode(code) {
  if (!code) return;
  
  try {
    const saved = localStorage.getItem("savedDiscountCodes");
    const codes = saved ? JSON.parse(saved) : [];
    
    const normalizedCode = code.trim().toUpperCase();
    const filtered = codes.filter(c => c !== normalizedCode);
    
    localStorage.setItem("savedDiscountCodes", JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing saved discount code:", error);
  }
}

/**
 * Create a new discount code.
 * `data` should include: code, type ('percentage' | 'fixed' | 'free_shipping'),
 * value, isActive, stackable, scope, and optionally category, productId, usageCount.
 */
export async function createDiscount(data = {}) {
  const discountsCol = getDiscountsCol();
  const payload = {
    code: (data.code || "").trim().toUpperCase(),
    description: data.description || "",
    type: data.type || "percentage",
    value: Number(data.value) || 0,
    minPurchaseUSD: Number(data.minPurchaseUSD) || 0,
    maxDiscountUSD: Number(data.maxDiscountUSD) || 0,
    isActive: data.isActive !== false,
    stackable: data.stackable === true,
    scope: data.scope || "site-wide",
    category: data.category || null,
    productId: data.productId || null,
    usageLimit: typeof data.usageLimit === "number" ? data.usageLimit : null,
    usageCount: typeof data.usageCount === "number" ? data.usageCount : 0,
    validFrom: data.validFrom || new Date().toISOString(),
    validUntil: data.validUntil || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const ref = await addDoc(discountsCol, payload);
  return { id: ref.id, ...payload };
}

/**
 * Update an existing discount. Must include `id`.
 * Accepts partial fields; updates `updatedAt`.
 */
export async function updateDiscount({ id, ...patch } = {}) {
  if (!id) throw new Error("updateDiscount requires an id");
  const ref = doc(db, "discounts", id);
  const next = { ...patch, updatedAt: new Date().toISOString() };
  await updateDoc(ref, next);
  const snap = await getDoc(ref);
  return { id: snap.id, ...(snap.data() || {}) };
}

/**
 * Delete a discount by id.
 *
 * @param {string} id
 */
export async function deleteDiscount(id) {
  if (!id) throw new Error("deleteDiscount requires id");
  const ref = doc(db, "discounts", id);
  await deleteDoc(ref);
}
