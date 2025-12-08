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
import { auth } from "@/lib/firebase";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// Configure Google Sign-In at module load (this is what worked before)
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

const AuthContext = createContext({});

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
    signInWithGoogle,
    signInWithApple,
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
