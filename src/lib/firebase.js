// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is properly configured
function isFirebaseConfigured() {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId
  );
}

// Initialize Firebase only if properly configured
let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let storage = null;
let firebaseInitialized = false;
let firebaseError = null;

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseInitialized = true;
    console.log("✓ Firebase initialized successfully");
  } else {
    console.warn("⚠️ Firebase not configured - missing environment variables");
    firebaseError = "Missing Firebase configuration. Please configure your .env file.";
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error);
  firebaseError = error.message || "Failed to initialize Firebase";
  firebaseInitialized = false;
}

// Export the Firebase instances (may be null if not initialized)
export { auth, googleProvider, db, storage, firebaseInitialized, firebaseError };
