import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useFirebaseAuth } from "@/contexts/AuthContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { Toaster } from "sonner-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { user, loading } = useFirebaseAuth();
  const router = useRouter();
  const segments = useSegments();
  const qc = useQueryClient();
  const prevUserIdRef = useRef(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);

  // Clear cache when user changes (login/logout/switch account)
  useEffect(() => {
    const currentUserId = user?.uid || null;
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== currentUserId) {
      // User changed - clear all cached data
      qc.clear();
      setEmailVerified(false);
      setVerificationChecked(false);
    }
    prevUserIdRef.current = currentUserId;
  }, [user?.uid, qc]);

  // Listen for email verification status from Firestore
  useEffect(() => {
    if (!user) {
      setEmailVerified(false);
      setVerificationChecked(true);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEmailVerified(data.emailVerified === true);
      } else {
        setEmailVerified(false);
      }
      setVerificationChecked(true);
    }, (error) => {
      console.log("Error listening to user doc:", error);
      setVerificationChecked(true);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (loading || !verificationChecked) return;

    const inAuthScreen = segments[0] === "auth";
    const inWelcomeScreen = segments[0] === "welcome";

    if (!user && !inAuthScreen && !inWelcomeScreen) {
      // Not logged in - go to auth
      router.replace("/auth");
    } else if (user && !emailVerified && !inWelcomeScreen) {
      // Logged in but email not verified - go to welcome/verification screen
      router.replace({ pathname: "/welcome", params: { email: user.email } });
    } else if (user && emailVerified && (inAuthScreen || inWelcomeScreen)) {
      // Logged in and verified - go to main app
      router.replace("/(tabs)");
    }
  }, [user, emailVerified, loading, verificationChecked, segments]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading || !verificationChecked) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="idea/[id]"
          options={{
            presentation: "card",
            gestureEnabled: true,
            gestureDirection: "horizontal",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="settings-modal"
          options={{
            presentation: "modal",
            gestureEnabled: true,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            presentation: "card",
            gestureEnabled: true,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="faq"
          options={{
            presentation: "card",
            gestureEnabled: true,
            animation: "slide_from_right",
          }}
        />
      </Stack>
      <Toaster position="top-center" />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <TutorialProvider>
              <RootLayoutNav />
            </TutorialProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
