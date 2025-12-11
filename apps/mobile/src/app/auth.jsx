import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, gradients } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { toast } from "sonner-native";
import Svg, { Path } from "react-native-svg";
import * as AppleAuthentication from "expo-apple-authentication";

// Google "G" Logo Component
const GoogleLogo = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export default function AuthScreen() {
  const { theme, isDark } = useTheme();
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useFirebaseAuth();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // For sign-up, validate confirm password
    if (!isLogin) {
      if (!confirmPassword) {
        toast.error("Please confirm your password");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setLoading(true);

    try {
      const { user, error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, marketingOptIn);

      setLoading(false);

      if (error) {
        toast.error(error);
        return;
      }

      if (user) {
        if (isLogin) {
          toast.success("Welcome back!");
          router.replace("/(tabs)");
        } else {
          // New sign-up: go to welcome/confirmation screen
          router.replace({ pathname: "/welcome", params: { email } });
        }
      }
    } catch (e) {
      setLoading(false);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { user, error } = await signInWithGoogle();
    setGoogleLoading(false);

    if (error) {
      if (!error.includes("cancelled")) {
        toast.error(error);
      }
    } else if (user) {
      toast.success("Welcome!");
      router.replace("/(tabs)");
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const { user, error } = await signInWithApple();
    setAppleLoading(false);

    if (error) {
      if (!error.includes("cancelled")) {
        toast.error(error);
      }
    } else if (user) {
      toast.success("Welcome!");
      router.replace("/(tabs)");
    }
  };

  // Dark blue background color from the theme
  const darkBgColor = "#050811";

  return (
    <View style={[styles.container, { backgroundColor: darkBgColor }]}>
      {/* Subtle gradient overlay */}
      <LinearGradient
        colors={["rgba(79, 125, 255, 0.15)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              {/* Logo Image - white version */}
              <Image
                source={require("../../assets/spillstack-logo-white.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[theme.typography.body, { color: "#FFFFFF", marginTop: -45, fontStyle: "italic" }]}>
                {isLogin ? "Welcome back" : "Start your journey"}
              </Text>
              {!isLogin && (
                <Text style={styles.signUpBenefit}>
                  Free account • Sync across devices • Never lose an idea
                </Text>
              )}
            </View>

            <View style={styles.form}>
              {/* Apple Sign In Button */}
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />

              {/* Google Sign In Button */}
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  {
                    backgroundColor: "#fff",
                    borderColor: theme.colors.border.subtle,
                  },
                ]}
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                activeOpacity={0.7}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <GoogleLogo size={20} />
                    <Text style={styles.googleButtonText}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: "#222B3D" }]} />
                <Text style={[theme.typography.subhead, { color: "#818BA3" }]}>
                  or
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: "#222B3D" }]} />
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: "#0C1220",
                    borderColor: "#222B3D",
                    color: "#F4F6FF",
                  },
                ]}
                placeholder="Email"
                placeholderTextColor="#818BA3"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: "#0C1220",
                    borderColor: "#222B3D",
                    color: "#F4F6FF",
                  },
                ]}
                placeholder={isLogin ? "Password" : "Create password"}
                placeholderTextColor="#818BA3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                textContentType="oneTimeCode"
                autoComplete="off"
              />

              {!isLogin && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: "#0C1220",
                      borderColor: "#222B3D",
                      color: "#F4F6FF",
                    },
                  ]}
                  placeholder="Confirm password"
                  placeholderTextColor="#818BA3"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="oneTimeCode"
                  autoComplete="off"
                />
              )}

              {/* Marketing opt-in checkbox (sign-up only) */}
              {!isLogin && (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setMarketingOptIn(!marketingOptIn)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    marketingOptIn && styles.checkboxChecked
                  ]}>
                    {marketingOptIn && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Send me tips and product updates
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: isLogin ? "#4F7DFF" : "#22C55E" },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isLogin ? "Sign In" : "Create Free Account"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setIsLogin(!isLogin);
                  setConfirmPassword("");
                }}
              >
                <Text style={[theme.typography.subhead, { color: "#B7C0D8" }]}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={{ color: "#4F7DFF", fontWeight: "600" }}>
                    {isLogin ? "Sign Up" : "Sign In"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Static styles only - theme-dependent styles are inline
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 594,
    height: 149,
  },
  form: {
    gap: 16,
  },
  appleButton: {
    height: 48,
    width: "100%",
  },
  googleButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  googleButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    alignItems: "center",
    marginTop: 16,
  },
  signUpBenefit: {
    color: "#818BA3",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#222B3D",
    backgroundColor: "#0C1220",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  checkboxLabel: {
    color: "#B7C0D8",
    fontSize: 14,
    flex: 1,
  },
});
