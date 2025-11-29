import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBOi50mWnhzqQgtz5dW5sBcIVvxy3rQXHY",
  authDomain: "spillstack.firebaseapp.com",
  projectId: "spillstack",
  storageBucket: "spillstack.firebasestorage.app",
  messagingSenderId: "732563511222",
  appId: "1:732563511222:web:22a88abf2873da94959317"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export default app;
