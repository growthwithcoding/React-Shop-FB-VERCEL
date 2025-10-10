// src/auth/AuthProvider.jsx
import { useEffect, useState } from "react";
import { auth, googleProvider, firebaseInitialized } from "../lib/firebase";
import { createUserDocIfMissing, getUser } from "../services/userService";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { AuthCtx } from "./useAuth";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // If Firebase isn't initialized, skip auth state monitoring
    if (!firebaseInitialized || !auth) {
      setInitializing(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          // Ensure Firestore user doc exists
          await createUserDocIfMissing(u);
          // Always read the latest user doc (so role changes are reflected)
          const profile = await getUser(u.uid);
          let role = profile?.role === "admin" ? "admin" : profile?.role === "agent" ? "agent" : "customer";
          
          // DEMO MODE: Check if demo role is set in localStorage
          const demoRole = localStorage.getItem('demoRole');
          if (demoRole && ['customer', 'agent', 'admin'].includes(demoRole)) {
            role = demoRole;
          }
          
          setUser({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            role: role,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth state handling failed:", err);
        // Fallback: still set user, but only basic info and 'customer'
        if (u) {
          let role = "customer";
          
          // DEMO MODE: Check if demo role is set in localStorage even on error
          const demoRole = localStorage.getItem('demoRole');
          if (demoRole && ['customer', 'agent', 'admin'].includes(demoRole)) {
            role = demoRole;
          }
          
          setUser({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            role: role,
          });
        } else {
          setUser(null);
        }
      } finally {
        setInitializing(false);
      }
    });

    return () => unsub();
  }, []);

  const signInEmail = (email, password) => {
    if (!firebaseInitialized || !auth) {
      return Promise.reject(new Error("Firebase is not initialized"));
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUpEmail = (email, password) => {
    if (!firebaseInitialized || !auth) {
      return Promise.reject(new Error("Firebase is not initialized"));
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signInGoogle = () => {
    if (!firebaseInitialized || !auth || !googleProvider) {
      return Promise.reject(new Error("Firebase is not initialized"));
    }
    return signInWithPopup(auth, googleProvider);
  };
  
  const resetPassword = (email) => {
    if (!firebaseInitialized || !auth) {
      return Promise.reject(new Error("Firebase is not initialized"));
    }
    return sendPasswordResetEmail(auth, email);
  };
  
  const logout = () => {
    if (!firebaseInitialized || !auth) {
      return Promise.reject(new Error("Firebase is not initialized"));
    }
    return signOut(auth);
  };

  const value = {
    user,
    initializing,
    signInEmail,
    signUpEmail,
    signInGoogle,
    resetPassword,
    logout,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
