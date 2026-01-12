import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// Get functions instance
const functions = getFunctions();

// Configure Google Sign-In at module load (this is what worked before)
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

const AuthContext = createContext({});

// Helper to create/update user document in Firestore
const createUserDocument = async (user, isNewUser = false, marketingOptIn = false, isOAuthUser = false) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // Only create if document doesn't exist (new user)
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      marketingOptIn: marketingOptIn,
      // OAuth users (Google/Apple) are already email-verified by their provider
      emailVerified: isOAuthUser ? true : false,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    // For existing users, update last login and ensure OAuth users are marked as verified
    const updates = { lastLoginAt: serverTimestamp() };
    if (isOAuthUser && !userSnap.data().emailVerified) {
      updates.emailVerified = true;
    }
    await setDoc(userRef, updates, { merge: true });
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      // Handle specific Firebase error codes with user-friendly messages
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        return { user: null, error: "No account found with this email. Please sign up instead." };
      }
      if (error.code === "auth/wrong-password") {
        return { user: null, error: "Incorrect password. Please try again." };
      }
      if (error.code === "auth/invalid-email") {
        return { user: null, error: "Please enter a valid email address." };
      }
      if (error.code === "auth/too-many-requests") {
        return { user: null, error: "Too many failed attempts. Please try again later." };
      }
      return { user: null, error: error.message };
    }
  };

  const signUp = async (email, password, marketingOptIn = false) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document in Firestore (triggers welcome email)
      await createUserDocument(result.user, true, marketingOptIn);
      // Send verification code via our custom Resend flow
      try {
        const sendVerificationCode = httpsCallable(functions, "sendVerificationCode");
        await sendVerificationCode();
      } catch (e) {
        console.log("Failed to send verification code:", e);
      }
      return { user: result.user, error: null, isNewUser: true };
    } catch (error) {
      // Handle specific Firebase error codes with user-friendly messages
      if (error.code === "auth/email-already-in-use") {
        return { user: null, error: "An account with this email already exists. Please sign in instead.", isNewUser: false };
      }
      if (error.code === "auth/invalid-email") {
        return { user: null, error: "Please enter a valid email address.", isNewUser: false };
      }
      if (error.code === "auth/weak-password") {
        return { user: null, error: "Password is too weak. Please use at least 6 characters.", isNewUser: false };
      }
      return { user: null, error: error.message, isNewUser: false };
    }
  };

  // Send verification code email via Resend
  const sendVerificationCode = async () => {
    try {
      const sendCode = httpsCallable(functions, "sendVerificationCode");
      await sendCode();
      return { error: null };
    } catch (error) {
      console.error("Failed to send verification code:", error);
      return { error: error.message || "Failed to send verification code" };
    }
  };

  // Verify the code entered by user
  const verifyEmailCode = async (code) => {
    try {
      const verifyCode = httpsCallable(functions, "verifyEmailCode");
      const result = await verifyCode({ code });
      return { success: result.data.verified, error: null };
    } catch (error) {
      console.error("Failed to verify code:", error);
      // Extract user-friendly message from Firebase error
      const message = error.message || "Failed to verify code";
      return { success: false, error: message };
    }
  };

  // Check if user's email is verified (from Firestore, not Firebase Auth)
  const checkEmailVerified = async () => {
    if (!user) return false;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        return userDoc.data().emailVerified === true;
      }
      return false;
    } catch (error) {
      console.error("Error checking verification status:", error);
      return false;
    }
  };

  // Legacy function kept for compatibility
  const resendVerificationEmail = async () => {
    return sendVerificationCode();
  };

  const signOut = async () => {
    try {
      // Sign out from Google if signed in
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in with Google
      }
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  // Delete account and all data
  const deleteAccount = async () => {
    try {
      const deleteUserAccount = httpsCallable(functions, "deleteUserAccount");
      await deleteUserAccount();
      // Sign out from Google if signed in
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in with Google
      }
      return { error: null };
    } catch (error) {
      console.error("Failed to delete account:", error);
      return { error: error.message || "Failed to delete account" };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Check if Google Play Services are available (always true on iOS)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Get the ID token
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        return { user: null, error: "No ID token received from Google" };
      }

      // Create Firebase credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with the credential
      const result = await signInWithCredential(auth, googleCredential);

      // Create user document if new (triggers welcome email for new users)
      // Pass isOAuthUser=true to mark email as verified (Google already verified it)
      await createUserDocument(result.user, false, false, true);

      return { user: result.user, error: null };
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { user: null, error: "Sign in cancelled" };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { user: null, error: "Sign in already in progress" };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { user: null, error: "Google Play Services not available" };
      } else {
        return { user: null, error: error.message };
      }
    }
  };

  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken } = credential;
      if (!identityToken) {
        return { user: null, error: "No identity token received from Apple" };
      }

      const provider = new OAuthProvider("apple.com");
      const oauthCredential = provider.credential({
        idToken: identityToken,
      });

      const result = await signInWithCredential(auth, oauthCredential);

      // Create user document if new (triggers welcome email for new users)
      // Pass isOAuthUser=true to mark email as verified (Apple already verified it)
      await createUserDocument(result.user, false, false, true);

      return { user: result.user, error: null };
    } catch (error) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        return { user: null, error: "Sign in cancelled" };
      }
      return { user: null, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    signInWithGoogle,
    signInWithApple,
    resendVerificationEmail,
    sendVerificationCode,
    verifyEmailCode,
    checkEmailVerified,
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
