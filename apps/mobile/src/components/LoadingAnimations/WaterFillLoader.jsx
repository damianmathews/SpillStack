import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Single bubble component
const Bubble = ({ startX, size, delay, duration }) => {
  const progress = useSharedValue(0);
  const wobble = useSharedValue(0);

  useEffect(() => {
    // Rise animation
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );

    // Wobble animation
    wobble.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sine) }),
          withTiming(-1, { duration: 500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
  }, []);

  const bubbleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -SCREEN_HEIGHT]);
    const translateX = wobble.value * 15;
    const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.7, 0.7, 0]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.5, 1, 0.8]);

    return {
      transform: [
        { translateY },
        { translateX },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 20,
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.8)",
        },
        bubbleStyle,
      ]}
    />
  );
};

export function WaterFillLoader({ progress = 0, statusText = "Processing..." }) {
  const { theme, isDark } = useTheme();

  // Animated fill height
  const fillHeight = useSharedValue(0);

  // Wave animations
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);

  // Water colors
  const waterColor = "#4DA6E8";
  const waterColorDark = "#3A8BC8";

  useEffect(() => {
    // Animate fill height based on progress
    fillHeight.value = withTiming(progress, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [progress]);

  useEffect(() => {
    // Wave 1 animation
    wave1.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Wave 2 animation (offset)
    wave2.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Generate bubbles
  const bubbles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      startX: Math.random() * (SCREEN_WIDTH - 20) + 10,
      size: 6 + Math.random() * 12,
      delay: i * 400,
      duration: 3000 + Math.random() * 2000,
    }));
  }, []);

  // Water container style
  const waterStyle = useAnimatedStyle(() => {
    const height = fillHeight.value * SCREEN_HEIGHT;
    return {
      height: Math.max(height, 0),
    };
  });

  // Wave 1 style
  const wave1Style = useAnimatedStyle(() => {
    const translateX = interpolate(wave1.value, [0, 1], [0, -60]);
    return {
      transform: [{ translateX }],
    };
  });

  // Wave 2 style
  const wave2Style = useAnimatedStyle(() => {
    const translateX = interpolate(wave2.value, [0, 1], [-30, -90]);
    return {
      transform: [{ translateX }],
    };
  });

  // Text position style - stays above water
  const textStyle = useAnimatedStyle(() => {
    const waterTop = SCREEN_HEIGHT * (1 - fillHeight.value);
    const textY = Math.max(waterTop - 100, 80);
    return {
      top: textY,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1a1a2e" : "#e8f4fc" }]}>
      {/* Water fill */}
      <Animated.View style={[styles.waterContainer, waterStyle]}>
        {/* Main water body */}
        <View style={[styles.waterBody, { backgroundColor: waterColor }]} />

        {/* Darker overlay at bottom for depth */}
        <View style={[styles.waterDepth, { backgroundColor: waterColorDark }]} />

        {/* Wave 1 - row of circles at top */}
        <Animated.View style={[styles.waveContainer, wave1Style]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={`w1-${i}`}
              style={[
                styles.waveBump,
                {
                  backgroundColor: waterColor,
                  width: 60,
                  height: 30,
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Wave 2 - offset row */}
        <Animated.View style={[styles.waveContainer2, wave2Style]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={`w2-${i}`}
              style={[
                styles.waveBump,
                {
                  backgroundColor: waterColorDark,
                  width: 50,
                  height: 20,
                  borderTopLeftRadius: 25,
                  borderTopRightRadius: 25,
                  opacity: 0.5,
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Bubbles */}
        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            startX={bubble.startX}
            size={bubble.size}
            delay={bubble.delay}
            duration={bubble.duration}
          />
        ))}

        {/* Foam dots at surface */}
        <View style={styles.foamContainer}>
          {Array.from({ length: 15 }).map((_, i) => (
            <FoamDot key={i} index={i} />
          ))}
        </View>
      </Animated.View>

      {/* Status text */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={[styles.statusText, { color: isDark ? "#fff" : "#333" }]}>
          {statusText}
        </Text>
        <Text style={[styles.percentText, { color: isDark ? "#aaa" : "#666" }]}>
          {Math.round(progress * 100)}%
        </Text>
      </Animated.View>
    </View>
  );
}

// Foam dot component
const FoamDot = ({ index }) => {
  const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const delay = index * 100;

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 500, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const size = 4 + Math.random() * 5;
  const left = (index / 15) * SCREEN_WIDTH;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: -size / 2,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  waterContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  waterBody: {
    ...StyleSheet.absoluteFillObject,
  },
  waterDepth: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    opacity: 0.3,
  },
  waveContainer: {
    position: "absolute",
    top: -15,
    left: 0,
    flexDirection: "row",
    width: SCREEN_WIDTH * 2,
  },
  waveContainer2: {
    position: "absolute",
    top: -10,
    left: 0,
    flexDirection: "row",
    width: SCREEN_WIDTH * 2,
  },
  waveBump: {
    marginRight: 0,
  },
  foamContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  textContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  statusText: {
    fontSize: 22,
    fontWeight: "600",
  },
  percentText: {
    fontSize: 16,
    marginTop: 8,
  },
});
