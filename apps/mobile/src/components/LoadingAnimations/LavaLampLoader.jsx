import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";

export function LavaLampLoader({ size = 120 }) {
  const { theme } = useTheme();

  // Animation values for the main blob
  const morphProgress = useSharedValue(0);
  const breatheProgress = useSharedValue(0);
  const rotateProgress = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);

  // Secondary blob animations
  const blob2Progress = useSharedValue(0);
  const blob3Progress = useSharedValue(0);

  useEffect(() => {
    // Main morph animation - smooth organic shape changes
    morphProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Breathing animation - gentle expand/contract
    breatheProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      false
    );

    // Slow rotation
    rotateProgress.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Shimmer effect
    shimmerProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Secondary blobs with offset timing
    blob2Progress.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    blob3Progress.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  // Main blob animated style
  const mainBlobStyle = useAnimatedStyle(() => {
    const scaleX = interpolate(morphProgress.value, [0, 0.5, 1], [1, 1.15, 1]);
    const scaleY = interpolate(morphProgress.value, [0, 0.5, 1], [1, 0.9, 1]);
    const breatheScale = interpolate(breatheProgress.value, [0, 1], [0.95, 1.05]);
    const rotate = interpolate(rotateProgress.value, [0, 1], [0, 360]);

    return {
      transform: [
        { scaleX: scaleX * breatheScale },
        { scaleY: scaleY * breatheScale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Inner glow/shimmer style
  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerProgress.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    const scale = interpolate(shimmerProgress.value, [0, 0.5, 1], [0.6, 0.8, 0.6]);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Secondary blob styles
  const blob2Style = useAnimatedStyle(() => {
    const translateX = interpolate(blob2Progress.value, [0, 0.5, 1], [-15, 20, -15]);
    const translateY = interpolate(blob2Progress.value, [0, 0.5, 1], [10, -15, 10]);
    const scale = interpolate(blob2Progress.value, [0, 0.5, 1], [0.6, 0.8, 0.6]);
    const opacity = interpolate(blob2Progress.value, [0, 0.5, 1], [0.6, 0.9, 0.6]);

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      opacity,
    };
  });

  const blob3Style = useAnimatedStyle(() => {
    const translateX = interpolate(blob3Progress.value, [0, 0.5, 1], [12, -18, 12]);
    const translateY = interpolate(blob3Progress.value, [0, 0.5, 1], [-8, 12, -8]);
    const scale = interpolate(blob3Progress.value, [0, 0.5, 1], [0.5, 0.7, 0.5]);
    const opacity = interpolate(blob3Progress.value, [0, 0.5, 1], [0.5, 0.8, 0.5]);

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      opacity,
    };
  });

  const primaryColor = theme.colors.accent.primary;
  const secondaryColor = theme.colors.accent.secondary || theme.colors.accent.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background glow */}
      <View
        style={[
          styles.glowBackground,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: primaryColor,
            opacity: 0.15,
          },
        ]}
      />

      {/* Secondary blob 3 (back) */}
      <Animated.View
        style={[
          styles.blob,
          blob3Style,
          {
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: size * 0.25,
            backgroundColor: secondaryColor,
          },
        ]}
      />

      {/* Secondary blob 2 */}
      <Animated.View
        style={[
          styles.blob,
          blob2Style,
          {
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: size * 0.2,
            backgroundColor: primaryColor,
          },
        ]}
      />

      {/* Main blob */}
      <Animated.View
        style={[
          styles.mainBlob,
          mainBlobStyle,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.35,
            backgroundColor: primaryColor,
          },
        ]}
      >
        {/* Inner shimmer */}
        <Animated.View
          style={[
            styles.shimmer,
            shimmerStyle,
            {
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size * 0.2,
              backgroundColor: "#FFFFFF",
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowBackground: {
    position: "absolute",
  },
  blob: {
    position: "absolute",
  },
  mainBlob: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shimmer: {
    position: "absolute",
  },
});
