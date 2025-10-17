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
  
  // Create local flag file to indicate setup is complete
  try {
    const response = await fetch('http://localhost:3001/api/create-setup-flag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('Failed to create setup flag file (non-critical)');
    }
  } catch (error) {
    console.warn('Could not create setup flag file:', error.message);
    // Non-critical error - setup can still be considered complete
  }
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
  
  try {
    // Step 1: Set flag to prevent AuthProvider from auto-creating customer document
    console.log("Setting onboarding flag...");
    sessionStorage.setItem('onboarding_admin_creation', 'true');
    
    // Step 2: Create Firebase Auth account
    console.log("Creating Firebase Auth account...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✓ User created in Firebase Auth:", user.uid);

    // Step 3: Prepare Firestore user document data
    const userData = {
      firstName: firstName || "",
      lastName: lastName || "",
      email: email,
      role: "admin",
      createdAt: new Date().toISOString(),
      isInitialAdmin: true, // Flag to identify the first admin - helps with security rules
    };

    // Step 4: Wait for auth state to propagate and get fresh ID token
    console.log("Waiting for auth state to propagate...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force token refresh to ensure auth state is fully synced
    await user.getIdToken(true);
    console.log("✓ Auth token refreshed");

    // Step 5: Create Firestore user document with admin role
    console.log("Creating Firestore user document...");
    const userRef = doc(db, "users", user.uid);
    
    try {
      await setDoc(userRef, userData);
      console.log("✓ User document created in Firestore:", user.uid);
    } catch (firestoreError) {
      console.error("Firestore write error:", firestoreError);
      
      // If permission denied during onboarding, provide detailed guidance
      if (firestoreError.code === 'permission-denied') {
        throw new Error(
          "Permission denied while creating admin user in Firestore.\n\n" +
          "Please ensure:\n" +
          "1. Your Firestore security rules have been deployed\n" +
          "2. The system/setup document doesn't exist or is not marked as completed\n" +
          "3. You've completed the 'Deploy Rules' step in the onboarding wizard\n\n" +
          "If you've already deployed the rules, try waiting a few moments for them to propagate, then try again."
        );
      }
      throw firestoreError;
    } finally {
      // Clear the onboarding flag
      sessionStorage.removeItem('onboarding_admin_creation');
    }
    
    // Step 5: Verify the document was actually created by reading it back
    console.log("Verifying user document creation...");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const verifySnap = await getDoc(userRef);
      
      if (!verifySnap.exists()) {
        console.error("✗ User document not found after creation");
        throw new Error("Failed to verify user document creation in Firestore");
      }
      
      console.log("✓ User document verified in Firestore");
    } catch (verifyError) {
      // If we can't read it back due to permissions, that's okay - it was likely created
      if (verifyError.code === 'permission-denied') {
        console.log("⚠ Cannot verify document due to read permissions, but creation likely succeeded");
      } else {
        throw verifyError;
      }
    }
    
    return {
      uid: user.uid,
      email: user.email,
      ...userData,
    };
  } catch (error) {
    console.error("Error creating admin user:", error);
    
    // Provide helpful error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("This email is already registered. Please use a different email or sign in.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password is too weak. Please use at least 6 characters.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Invalid email address format.");
    } else if (error.code === 'permission-denied') {
      // Already handled above with detailed message
      throw error;
    }
    
    throw new Error(error.message || "Failed to create admin user");
  }
}

/**
 * Initialize store settings with provided data
 */
export async function initializeStoreSettings(settings) {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized. Please configure your .env file first.");
  }

  const settingsRef = doc(db, "system", "settings");
  
  // Build the settings object using provided values or defaults
  const storeSettings = {
    store: {
      name: settings.storeName || "My Store",
      email: settings.storeEmail || "",
      logo: settings.storeLogo || "",
      supportPhone: settings.supportPhone || "",
      supportHours: settings.supportHours || {
        monday: { isOpen: true, open: "09:00", close: "17:00" },
        tuesday: { isOpen: true, open: "09:00", close: "17:00" },
        wednesday: { isOpen: true, open: "09:00", close: "17:00" },
        thursday: { isOpen: true, open: "09:00", close: "17:00" },
        friday: { isOpen: true, open: "09:00", close: "17:00" },
        saturday: { isOpen: false, open: "10:00", close: "14:00" },
        sunday: { isOpen: false, open: "10:00", close: "14:00" },
      },
    },
    payments: settings.payments || {
      enableCards: true,
      cod: false,
      pk: "",
      connected: false,
      acceptedMethods: ["card", "paypal", "apple_pay", "google_pay"],
    },
    shipping: settings.shipping || {
      base: 5,
      enableFreeShipping: false,
      freeAt: 50,
    },
    taxes: settings.taxes || {
      rate: 7.5,
      origin: "UT",
    },
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(settingsRef, storeSettings, { merge: true });
    return storeSettings;
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
          return storeSettings;
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
