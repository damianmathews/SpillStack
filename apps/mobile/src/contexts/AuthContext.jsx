import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Platform } from "react-native";

// Lazy load Google Sign-In to avoid TurboModule initialization crash
let GoogleSignin = null;
let statusCodes = null;
let googleSignInLoadAttempted = false;
let googleSignInLoadPromise = null;

const loadGoogleSignIn = () => {
  // Return cached result if already loaded
  if (GoogleSignin) return Promise.resolve({ GoogleSignin, statusCodes });

  // Return existing promise if load is in progress
  if (googleSignInLoadPromise) return googleSignInLoadPromise;

  // Only attempt to load once
  if (googleSignInLoadAttempted) return Promise.resolve({ GoogleSignin: null, statusCodes: null });

  googleSignInLoadAttempted = true;

  googleSignInLoadPromise = new Promise((resolve) => {
    // Use setTimeout to ensure we're not in the critical initialization path
    setTimeout(async () => {
      try {
        const module = await import("@react-native-google-signin/google-signin");
        GoogleSignin = module.GoogleSignin;
        statusCodes = module.statusCodes;
        resolve({ GoogleSignin, statusCodes });
      } catch (error) {
        console.warn("Failed to load Google Sign-In:", error);
        resolve({ GoogleSignin: null, statusCodes: null });
      }
    }, 0);
  });

  return googleSignInLoadPromise;
};

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleSignInReady, setGoogleSignInReady] = useState(false);
  const googleSignInConfigured = useRef(false);

  // Initialize Google Sign-In after component mounts (safe for native modules)
  useEffect(() => {
    const initGoogleSignIn = async () => {
      if (googleSignInConfigured.current) return;

      // Skip if no client ID configured
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      if (!iosClientId) {
        console.warn("Google Sign-In: No iOS client ID configured");
        return;
      }

      try {
        const { GoogleSignin: GS } = await loadGoogleSignIn();
        if (GS && !googleSignInConfigured.current) {
          googleSignInConfigured.current = true;
          GS.configure({
            iosClientId,
          });
          setGoogleSignInReady(true);
        }
      } catch (error) {
        console.warn("Failed to configure Google Sign-In:", error);
      }
    };

    // Delay initialization to ensure React Native bridge is fully ready
    // Using 500ms to give ample time for all native modules to initialize
    const timer = setTimeout(initGoogleSignIn, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const signUp = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Google if signed in
      try {
        const { GoogleSignin: GS } = await loadGoogleSignIn();
        if (GS) {
          await GS.signOut();
        }
      } catch (e) {
        // Ignore if not signed in with Google
      }
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { GoogleSignin: GS, statusCodes: SC } = await loadGoogleSignIn();

      if (!GS) {
        return { user: null, error: "Google Sign-In not available" };
      }

      // Check if Google Play Services are available (always true on iOS)
      await GS.hasPlayServices();

      // Sign in with Google
      const userInfo = await GS.signIn();

      // Get the ID token
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        return { user: null, error: "No ID token received from Google" };
      }

      // Create Firebase credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with the credential
      const result = await signInWithCredential(auth, googleCredential);

      return { user: result.user, error: null };
    } catch (error) {
      const { statusCodes: SC } = await loadGoogleSignIn();
      if (SC && error.code === SC.SIGN_IN_CANCELLED) {
        return { user: null, error: "Sign in cancelled" };
      } else if (SC && error.code === SC.IN_PROGRESS) {
        return { user: null, error: "Sign in already in progress" };
      } else if (SC && error.code === SC.PLAY_SERVICES_NOT_AVAILABLE) {
        return { user: null, error: "Google Play Services not available" };
      } else {
        return { user: null, error: error.message };
      }
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within an AuthProvider");
  }
  return context;
};
