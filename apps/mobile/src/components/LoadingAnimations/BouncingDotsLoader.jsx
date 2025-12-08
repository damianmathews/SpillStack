import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/primitives";
import { Sparkles } from "lucide-react-native";

const MESSAGES = [
  "Extracting brilliance...",
  "Organizing thoughts...",
  "Finding the gems...",
  "Almost there...",
];

const Dot = ({ delay, color }) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

export function BouncingDotsLoader({ statusText }) {
  const { theme, isDark } = useTheme();
  const messageIndex = useSharedValue(0);
  const messageOpacity = useSharedValue(1);

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      messageOpacity.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
      messageIndex.value = (messageIndex.value + 1) % MESSAGES.length;
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const colors = [
    theme.colors.accent.primary,
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#EC4899", // Pink
    "#8B5CF6", // Purple
  ];

  return (
    <View style={[styles.container, { backgroundColor: "transparent" }]}>
      {/* Sparkle icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.accent.primary}15` }]}>
        <Sparkles size={32} color={theme.colors.accent.primary} strokeWidth={2} />
      </View>

      {/* Message */}
      <AppText
        variant="title"
        color="primary"
        style={styles.message}
      >
        {statusText || "AI is thinking..."}
      </AppText>

      {/* Bouncing dots */}
      <View style={styles.dotsContainer}>
        {colors.map((color, index) => (
          <Dot key={index} delay={index * 120} color={color} />
        ))}
      </View>

      {/* Sub-message */}
      <AppText
        variant="body"
        color="muted"
        style={styles.subMessage}
      >
        This only takes a moment
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  message: {
    textAlign: "center",
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 50,
    marginBottom: 24,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  subMessage: {
    textAlign: "center",
  },
});
