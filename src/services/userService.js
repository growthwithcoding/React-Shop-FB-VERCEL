// src/services/userService.js
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";

/**
 * Firestore "users" collection schema (canonical):
 * {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   role: "customer" | "admin" | "agent",
 *   createdAt: string (ISO)
 * }
 * All returned objects include { id } (document id).
 */

function splitName(name = "") {
  const s = `${name}`.trim();
  if (!s) return { firstName: "", lastName: "" };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.slice(-1)[0] };
}

/* -----------------------------
 * Auth bootstrap helper
 * -----------------------------
 * Ensures a user doc exists at users/{uid}. If missing, create it (role defaults to "customer").
 * Accepts either a Firebase Auth user object or a plain object: { uid, displayName|firstName|lastName, email, role? }.
 */
export async function createUserDocIfMissing(input) {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  
  if (!input) throw new Error("createUserDocIfMissing requires input");

  const uid =
    typeof input.uid === "string"
      ? input.uid
      : input.user?.uid || input.currentUser?.uid;

  if (!uid) throw new Error("createUserDocIfMissing requires a uid");

  const displayName =
    typeof input.displayName === "string"
      ? input.displayName
      : typeof input.name === "string"
      ? input.name
      : "";

  const email =
    typeof input.email === "string"
      ? input.email
      : typeof input.user?.email === "string"
      ? input.user.email
      : "";

  const role = input.role === "admin" ? "admin" : input.role === "agent" ? "agent" : "customer";
  const providedFirst = typeof input.firstName === "string" ? input.firstName : undefined;
  const providedLast  = typeof input.lastName  === "string" ? input.lastName  : undefined;
  const derived = splitName(displayName);

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const payload = {
      firstName: providedFirst ?? derived.firstName,
      lastName:  providedLast  ?? derived.lastName,
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, payload, { merge: true });
    return { id: uid, ...payload, _created: true };
  }

  const data = snap.data() || {};
  return {
    id: uid,
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName:  typeof data.lastName  === "string" ? data.lastName  : "",
    email:     typeof data.email     === "string" ? data.email     : "",
    role: data.role === "admin" ? "admin" : data.role === "agent" ? "agent" : "customer",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
    _created: false,
  };
}

/* -----------------------------
 * READ (by id)
 * ----------------------------- */
export async function getUser(id) {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  
  if (!id) return null;
  const ref = doc(db, "users", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() || {};
  return {
    id: snap.id,
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName:  typeof data.lastName  === "string" ? data.lastName  : "",
    email:     typeof data.email     === "string" ? data.email     : "",
    role: data.role === "admin" ? "admin" : data.role === "agent" ? "agent" : "customer",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
  };
}

/* -----------------------------
 * LIST (admin)
 * ----------------------------- */
export async function getUsers({ take = 100 } = {}) {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  
  const qy = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(take));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      firstName: typeof data.firstName === "string" ? data.firstName : "",
      lastName:  typeof data.lastName  === "string" ? data.lastName  : "",
      email:     typeof data.email     === "string" ? data.email     : "",
      role: data.role === "admin" ? "admin" : data.role === "agent" ? "agent" : "customer",
      createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
    };
  });
}

/* -----------------------------
 * CREATE (admin UI)
 * ----------------------------- */
export async function createUser(input = {}) {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  
  const role = input.role === "admin" ? "admin" : input.role === "agent" ? "agent" : "customer";
  const payload = {
    firstName: typeof input.firstName === "string" ? input.firstName : "",
    lastName:  typeof input.lastName  === "string" ? input.lastName  : "",
    email:     typeof input.email     === "string" ? input.email     : "",
    role,
    createdAt: new Date().toISOString(),
  };

  if (input.id) {
    const ref = doc(db, "users", input.id);
    await setDoc(ref, payload, { merge: true });
    const snap = await getDoc(ref);
    const data = snap.data() || payload;
    return { id: snap.id, ...data };
  }

  const col = collection(db, "users");
  const created = await addDoc(col, payload);
  const snap = await getDoc(created);
  return { id: created.id, ...(snap.data() || payload) };
}

/* -----------------------------
 * UPDATE (admin/UI)
 * ----------------------------- */
export async function updateUser({ id, ...patch } = {}) {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  
  if (!id) throw new Error("updateUser requires an id");

  const ref = doc(db, "users", id);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() || {} : {};

  // Compose safe payload (must preserve existing role to satisfy rules)
  const next = {
    role: existing.role || "customer",
  };

  if (typeof patch.firstName === "string") next.firstName = patch.firstName;
  if (typeof patch.lastName === "string") next.lastName = patch.lastName;
  if (typeof patch.email === "string") next.email = patch.email;
  if (patch.role === "admin" || patch.role === "customer" || patch.role === "agent") next.role = patch.role;

  // Merge so new users or partial updates succeed
  await setDoc(ref, next, { merge: true });

  const updatedSnap = await getDoc(ref);
  const data = updatedSnap.exists() ? updatedSnap.data() || {} : next;

  return {
    id: ref.id,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
    role: data.role === "admin" ? "admin" : data.role === "agent" ? "agent" : "customer",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
  };
}

/* -----------------------------
 * DELETE (admin UI)
 * ----------------------------- */
export async function deleteUser(id) {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  
  if (!id) throw new Error("deleteUser requires an id");
  await deleteDoc(doc(db, "users", id));
}
