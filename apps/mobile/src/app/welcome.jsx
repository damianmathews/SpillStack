import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { toast } from "sonner-native";
import Svg, { Path, Circle } from "react-native-svg";

// Email icon (waiting state)
const EmailIcon = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
      stroke="#4F7DFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Checkmark icon (verified state)
const CheckIcon = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" stroke="#22C55E" strokeWidth="2" />
    <Path
      d="M7 12.5L10.5 16L17 9"
      stroke="#22C55E"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function WelcomeScreen() {
  const { sendVerificationCode, verifyEmailCode, user, signOut } = useFirebaseAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const email = params.email || user?.email || "";

  const handleCodeChange = (text, index) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeString) => {
    const fullCode = codeString || code.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setVerifying(true);
    const { success, error } = await verifyEmailCode(fullCode);
    setVerifying(false);

    if (error) {
      toast.error(error);
      // Clear code on error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } else if (success) {
      setVerified(true);
      toast.success("Email verified!");
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    const { error } = await sendVerificationCode();
    setResending(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Verification code sent!");
      // Clear existing code
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  const darkBgColor = "#050811";

  return (
    <View style={[styles.container, { backgroundColor: darkBgColor }]}>
      <LinearGradient
        colors={[verified ? "rgba(34, 197, 94, 0.15)" : "rgba(79, 125, 255, 0.15)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {verified ? <CheckIcon size={100} /> : <EmailIcon size={100} />}
          </View>

          <Text style={styles.title}>
            {verified ? "Email Verified!" : "Verify Your Email"}
          </Text>
          <Text style={styles.subtitle}>
            {verified
              ? "You're all set. Redirecting to SpillStack..."
              : "Enter the 6-digit code we sent to:"
            }
          </Text>

          {!verified && email && (
            <View style={styles.emailCard}>
              <Text style={styles.emailAddress}>{email}</Text>
            </View>
          )}

          {!verified && (
            <>
              {/* Code input */}
              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleVerifyCode()}
                  disabled={verifying || code.join("").length !== 6}
                  activeOpacity={0.8}
                >
                  {verifying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleResendCode}
                  disabled={resending}
                  activeOpacity={0.7}
                >
                  {resending ? (
                    <ActivityIndicator color="#4F7DFF" size="small" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      Resend code
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                >
                  <Text style={styles.signOutButtonText}>
                    Use a different email
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {verified && (
            <ActivityIndicator color="#22C55E" size="large" style={{ marginTop: 24 }} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: "#B7C0D8",
    textAlign: "center",
    marginBottom: 16,
  },
  emailCard: {
    backgroundColor: "#0C1220",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#222B3D",
    alignItems: "center",
  },
  emailAddress: {
    fontSize: 16,
    color: "#F4F6FF",
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: "#0C1220",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#222B3D",
    color: "#F4F6FF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  codeInputFilled: {
    borderColor: "#4F7DFF",
    backgroundColor: "#0C1220",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#4F7DFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#4F7DFF",
    fontSize: 15,
    fontWeight: "500",
  },
  signOutButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  signOutButtonText: {
    color: "#818BA3",
    fontSize: 14,
  },
});
