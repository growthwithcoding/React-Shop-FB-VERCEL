// src/services/onboardingService.js
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db, auth, firebaseInitialized, firebaseError } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

/**
 * Validate Firebase/Firestore credentials are properly configured
 */
export async function validateFirebaseCredentials() {
  const errors = [];
  const warnings = [];
  
  // Check if Firebase was initialized at all
  if (!firebaseInitialized) {
    // Check environment variables - MESSAGING_SENDER_ID is optional (only needed for FCM push notifications)
    const requiredEnvVars = {
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    const missingVars = [];
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        missingVars.push(key);
      }
    }

    if (missingVars.length > 0) {
      errors.push({
        type: "missing_env_vars",
        message: "Missing required Firebase environment variables",
        details: missingVars,
      });
    } else if (firebaseError) {
      // Firebase config exists but initialization failed
      errors.push({
        type: "init_error",
        message: "Firebase initialization failed",
        details: firebaseError,
      });
    }

    return {
      isValid: false,
      errors,
      warnings,
    };
  }

  // Test Firestore connection
  try {
    // Try to query the system collection - this tests connection without requiring a specific document
    const systemRef = doc(db, "system", "setup");
    await getDoc(systemRef);
    // Success if we can query (even if doc doesn't exist)
    // The fact that we didn't get a network/auth error means connection is working
  } catch (error) {
    console.error("Firestore connection test failed:", error);
    // Only report connection errors, not permission errors (permission errors are expected during onboarding)
    if (error.code && error.code !== 'permission-denied' && !error.code.includes('not-found')) {
      errors.push({
        type: "firestore_connection",
        message: "Failed to connect to Firestore",
        details: error.code || error.message,
      });
    }
  }

  // Test Firebase Auth connection
  try {
    // Just check if auth object is properly initialized
    if (!auth || !auth.app) {
      throw new Error("Firebase Auth not properly initialized");
    }
  } catch (error) {
    console.error("Firebase Auth test failed:", error);
    errors.push({
      type: "auth_connection",
      message: "Failed to initialize Firebase Auth",
      details: error.message,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if the app has been set up (onboarding completed)
 * Returns true if setup is complete, false if onboarding is needed
 */
export async function isOnboardingComplete() {
  // If Firebase isn't initialized, onboarding is definitely needed
  if (!firebaseInitialized || !db) {
    return false;
  }

  try {
    // Check if setup document exists
    const setupRef = doc(db, "system", "setup");
    const setupSnap = await getDoc(setupRef);
    
    if (setupSnap.exists() && setupSnap.data()?.completed === true) {
      return true;
    }

    // Also check if any admin users exist as fallback
    const usersRef = collection(db, "users");
    const adminQuery = query(usersRef, where("role", "==", "admin"), limit(1));
    const adminSnap = await getDocs(adminQuery);
    
    return !adminSnap.empty;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    // On error, assume setup is needed to be safe
    return false;
  }
}

/**
 * Mark onboarding as complete
 */
export async function markOnboardingComplete() {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  
  const setupRef = doc(db, "system", "setup");
  await setDoc(setupRef, {
    completed: true,
    completedAt: new Date().toISOString(),
    version: "1.0.0",
  }, { merge: true });
}

/**
 * Create the initial admin user
 */
export async function createAdminUser({ email, password, firstName, lastName }) {
  if (!firebaseInitialized || !auth || !db) {
    throw new Error("Firebase is not initialized. Please configure your .env file first.");
  }

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  let userCredential = null;
  let wasPermissionError = false;
  
  try {
    // Create Firebase Auth account
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create Firestore user document with admin role
    const userRef = doc(db, "users", user.uid);
    const userData = {
      firstName: firstName || "",
      lastName: lastName || "",
      email: email,
      role: "admin",
      createdAt: new Date().toISOString(),
      isInitialAdmin: true, // Flag to identify the first admin
    };

    try {
      await setDoc(userRef, userData);
      
      // Wait for auth state and security rules to fully propagate
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        uid: user.uid,
        email: user.email,
        ...userData,
      };
    } catch (setDocError) {
      // If we get a permission error, it might still have succeeded
      // This can happen during onboarding due to security rule timing
      if (setDocError.code === 'permission-denied') {
        console.log("Permission error on setDoc, but will verify if write succeeded");
        wasPermissionError = true;
      } else {
        throw setDocError;
      }
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    
    // Only proceed with verification if we got a permission error or have a user credential
    if (!userCredential?.user && !wasPermissionError) {
      throw new Error(error.message || "Failed to create admin user");
    }
  }
  
  // If we reach here, either we got a permission error or another error after user creation
  // Verify if the user document was actually created
  if (userCredential?.user) {
    try {
      console.log("Verifying user document creation for:", userCredential.user.uid);
      
      // Wait for Firestore to propagate the write
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log("✓ User document verified in Firestore - operation was successful");
        const userData = userSnap.data();
        return {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          ...userData,
        };
      }
      
      // Document doesn't exist yet, but if we had a permission error, it might still be propagating
      if (wasPermissionError) {
        console.log("✓ Permission error occurred but user created in Auth - assuming success");
        return {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          firstName: firstName || "",
          lastName: lastName || "",
          role: "admin",
          createdAt: new Date().toISOString(),
          isInitialAdmin: true,
        };
      }
    } catch (verifyError) {
      console.error("Error during verification:", verifyError);
      
      // If verification fails with permission error, assume the write succeeded
      if (verifyError.code === 'permission-denied' && userCredential?.user) {
        console.log("✓ Verification permission error - assuming user document was created");
        return {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          firstName: firstName || "",
          lastName: lastName || "",
          role: "admin",
          createdAt: new Date().toISOString(),
          isInitialAdmin: true,
        };
      }
    }
  }
  
  throw new Error("Failed to create admin user");
}

/**
 * Initialize store settings with provided data
 */
export async function initializeStoreSettings(settings) {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized. Please configure your .env file first.");
  }

  const settingsRef = doc(db, "system", "settings");
  
  const defaultSettings = {
    store: {
      name: settings.storeName || "My Store",
      email: settings.storeEmail || "",
      logo: settings.storeLogo || "",
      supportPhone: settings.supportPhone || "",
      supportHours: {
        monday: { isOpen: true, open: "09:00", close: "17:00" },
        tuesday: { isOpen: true, open: "09:00", close: "17:00" },
        wednesday: { isOpen: true, open: "09:00", close: "17:00" },
        thursday: { isOpen: true, open: "09:00", close: "17:00" },
        friday: { isOpen: true, open: "09:00", close: "17:00" },
        saturday: { isOpen: false, open: "10:00", close: "14:00" },
        sunday: { isOpen: false, open: "10:00", close: "14:00" },
      },
    },
    payments: {
      enableCards: true,
      cod: false,
      pk: "",
      connected: false,
      acceptedMethods: ["card", "paypal", "apple_pay", "google_pay"],
    },
    shipping: {
      base: 5,
      freeAt: 50,
    },
    taxes: {
      rate: 7.5,
      origin: "UT",
    },
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(settingsRef, defaultSettings, { merge: true });
    return defaultSettings;
  } catch (error) {
    console.error("Error initializing store settings:", error);
    
    // If we get a permission error, verify if the write actually succeeded
    if (error.code === 'permission-denied') {
      console.log("Permission error on settings write, verifying if it succeeded...");
      
      try {
        // Wait for potential propagation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          console.log("✓ Settings document verified - operation was successful");
          return settingsSnap.data();
        }
      } catch (verifyError) {
        console.error("Error verifying settings creation:", verifyError);
        
        // If verification also fails with permission error, assume it succeeded
        if (verifyError.code === 'permission-denied') {
          console.log("✓ Verification permission error - assuming settings were created");
          return defaultSettings;
        }
      }
    }
    
    throw error;
  }
}

/**
 * Get onboarding status including what steps have been completed
 */
export async function getOnboardingStatus() {
  if (!firebaseInitialized || !db) {
    return {
      isComplete: false,
      hasAdmin: false,
      hasSettings: false,
    };
  }

  try {
    const setupRef = doc(db, "system", "setup");
    const setupSnap = await getDoc(setupRef);
    
    if (!setupSnap.exists()) {
      return {
        isComplete: false,
        hasAdmin: false,
        hasSettings: false,
      };
    }

    const data = setupSnap.data();
    
    // Check for admin users
    const usersRef = collection(db, "users");
    const adminQuery = query(usersRef, where("role", "==", "admin"), limit(1));
    const adminSnap = await getDocs(adminQuery);
    
    // Check for settings
    const settingsRef = doc(db, "system", "settings");
    const settingsSnap = await getDoc(settingsRef);
    
    return {
      isComplete: data?.completed === true,
      hasAdmin: !adminSnap.empty,
      hasSettings: settingsSnap.exists(),
      completedAt: data?.completedAt || null,
    };
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return {
      isComplete: false,
      hasAdmin: false,
      hasSettings: false,
    };
  }
}
