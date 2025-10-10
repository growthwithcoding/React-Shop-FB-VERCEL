// src/services/settingsService.js
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";

const SETTINGS_PATH = ["settings", "default"];
const getRef = () => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return doc(db, ...SETTINGS_PATH);
};

const DEFAULTS = {
  store:    { 
    name: "", 
    email: "", 
    logo: "",
    supportPhone: "",
    supportHours: {
      monday: { isOpen: true, open: "09:00", close: "17:00" },
      tuesday: { isOpen: true, open: "09:00", close: "17:00" },
      wednesday: { isOpen: true, open: "09:00", close: "17:00" },
      thursday: { isOpen: true, open: "09:00", close: "17:00" },
      friday: { isOpen: true, open: "09:00", close: "17:00" },
      saturday: { isOpen: false, open: "10:00", close: "14:00" },
      sunday: { isOpen: false, open: "10:00", close: "14:00" },
    }
  },
  payments: { 
    enableCards: true, 
    cod: false, 
    pk: "", 
    connected: false,
    acceptedMethods: ["card", "paypal", "apple_pay", "google_pay"] // Available payment methods
  },
  shipping: { base: 5, freeAt: 50 },
  taxes:    { rate: 7.5, origin: "UT" },
};

export async function getSettings() {
  const ref = getRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...DEFAULTS };
  const data = snap.data() || {};
  return {
    store:    { ...DEFAULTS.store,    ...(data.store    || {}) },
    payments: { ...DEFAULTS.payments, ...(data.payments || {}) },
    shipping: { ...DEFAULTS.shipping, ...(data.shipping || {}) },
    taxes:    { ...DEFAULTS.taxes,    ...(data.taxes    || {}) },
    updatedAt: data.updatedAt || null,
    updatedBy: data.updatedBy || null,
  };
}

/**
 * Save all sections. Uses dot-paths so nested maps are always written even if
 * the doc previously had flat fields.
 */
export async function saveSettings(fullSettings, { uid = null } = {}) {
  const store    = { ...DEFAULTS.store,    ...(fullSettings.store    || {}) };
  const payments = { ...DEFAULTS.payments, ...(fullSettings.payments || {}) };
  const shipping = { ...DEFAULTS.shipping, ...(fullSettings.shipping || {}) };
  const taxes    = { ...DEFAULTS.taxes,    ...(fullSettings.taxes    || {}) };

  const payload = {
    "store.name": store.name ?? "",
    "store.email": store.email ?? "",
    "store.logo": store.logo ?? "",
    "store.supportPhone": store.supportPhone ?? "",
    "store.supportHours": store.supportHours ?? DEFAULTS.store.supportHours,

    "payments.enableCards": !!payments.enableCards,
    "payments.cod": !!payments.cod,
    "payments.pk": payments.pk || "",
    "payments.connected": !!payments.connected,
    "payments.acceptedMethods": Array.isArray(payments.acceptedMethods) 
      ? payments.acceptedMethods 
      : DEFAULTS.payments.acceptedMethods,

    "shipping.base": Number.isFinite(shipping.base) ? Number(shipping.base) : DEFAULTS.shipping.base,
    "shipping.freeAt": Number.isFinite(shipping.freeAt) ? Number(shipping.freeAt) : DEFAULTS.shipping.freeAt,

    "taxes.rate": Number.isFinite(taxes.rate) ? Number(taxes.rate) : DEFAULTS.taxes.rate,
    "taxes.origin": taxes.origin || DEFAULTS.taxes.origin,

    updatedAt: new Date().toISOString(),
    updatedBy: uid || null,
  };

  // dot-paths require updateDoc; if the doc doesn't exist yet, create it first
  const ref = getRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // seed with a minimal structure
    await setDoc(ref, { ...DEFAULTS, updatedAt: payload.updatedAt, updatedBy: payload.updatedBy });
  }
  await updateDoc(ref, payload);
  return { store, payments, shipping, taxes, updatedAt: payload.updatedAt, updatedBy: payload.updatedBy };
}

/** Patch one section via dot-paths */
export async function updateSettingsSection(section, patch, { uid = null } = {}) {
  const ref = getRef();
  const now = new Date().toISOString();
  const toMerge = { updatedAt: now, updatedBy: uid || null };

  if (section === "store") {
    toMerge["store.name"] = patch.name ?? null;
    toMerge["store.email"] = patch.email ?? null;
    toMerge["store.logo"] = patch.logo ?? null;
    if ("supportPhone" in patch) toMerge["store.supportPhone"] = patch.supportPhone ?? "";
    if ("supportHours" in patch) toMerge["store.supportHours"] = patch.supportHours ?? DEFAULTS.store.supportHours;
  } else if (section === "payments") {
    if ("enableCards" in patch) toMerge["payments.enableCards"] = !!patch.enableCards;
    if ("cod" in patch)        toMerge["payments.cod"] = !!patch.cod;
    if ("pk" in patch)         toMerge["payments.pk"] = patch.pk || "";
    if ("connected" in patch)  toMerge["payments.connected"] = !!patch.connected;
    if ("acceptedMethods" in patch) toMerge["payments.acceptedMethods"] = Array.isArray(patch.acceptedMethods) 
      ? patch.acceptedMethods 
      : DEFAULTS.payments.acceptedMethods;
  } else if (section === "shipping") {
    if ("base" in patch)   toMerge["shipping.base"] = Number(patch.base);
    if ("freeAt" in patch) toMerge["shipping.freeAt"] = Number(patch.freeAt);
  } else if (section === "taxes") {
    if ("rate" in patch)   toMerge["taxes.rate"] = Number(patch.rate);
    if ("origin" in patch) toMerge["taxes.origin"] = patch.origin || "";
  } else {
    throw new Error("updateSettingsSection: invalid section");
  }

  const snap = await getDoc(ref);
  if (!snap.exists()) await setDoc(ref, { ...DEFAULTS, updatedAt: now, updatedBy: uid || null });

  await updateDoc(ref, toMerge);
  return true;
}

export async function resetSettings({ uid = null } = {}) {
  const ref = getRef();
  const payload = { ...DEFAULTS, updatedAt: new Date().toISOString(), updatedBy: uid || null };
  await setDoc(ref, payload);
  return payload;
}

export function watchSettings(cb) {
  const ref = getRef();
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb({ ...DEFAULTS });
    const data = snap.data() || {};
    cb({
      store:    { ...DEFAULTS.store,    ...(data.store    || {}) },
      payments: { ...DEFAULTS.payments, ...(data.payments || {}) },
      shipping: { ...DEFAULTS.shipping, ...(data.shipping || {}) },
      taxes:    { ...DEFAULTS.taxes,    ...(data.taxes    || {}) },
      updatedAt: data.updatedAt || null,
      updatedBy: data.updatedBy || null,
    });
  });
}
