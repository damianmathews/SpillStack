import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Defs, Rect, Mask } from "react-native-svg";
import { useTheme } from "@/contexts/ThemeContext";
import { useTutorial, TUTORIAL_STEPS } from "@/contexts/TutorialContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const SPOTLIGHT_PADDING = 12;
const TOOLTIP_WIDTH = SCREEN_WIDTH - 48;

export function SpotlightTutorial() {
  const { theme } = useTheme();
  const {
    showTutorial,
    currentStep,
    totalSteps,
    currentStepData,
    targetMeasurements,
    measureTargets,
    nextStep,
    skipTutorial,
  } = useTutorial();

  const [isVisible, setIsVisible] = useState(false);

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const tooltipOpacity = useSharedValue(0);
  const tooltipTranslateY = useSharedValue(20);
  const spotlightScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  // Spotlight position and size
  const spotlightX = useSharedValue(SCREEN_WIDTH / 2);
  const spotlightY = useSharedValue(SCREEN_HEIGHT / 2);
  const spotlightWidth = useSharedValue(100);
  const spotlightHeight = useSharedValue(100);

  // Get current target measurement
  const currentTargetId = TUTORIAL_STEPS[currentStep]?.id;
  const currentTarget = targetMeasurements[currentTargetId];

  // Handle visibility
  useEffect(() => {
    if (showTutorial) {
      setIsVisible(true);
      // Small delay to ensure measurements are ready
      setTimeout(() => {
        measureTargets();
      }, 100);
    }
  }, [showTutorial]);

  // Animate in when visible
  useEffect(() => {
    if (isVisible && showTutorial) {
      overlayOpacity.value = withTiming(1, { duration: 400 });
      tooltipOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
      tooltipTranslateY.value = withSpring(0, { damping: 20, stiffness: 300 });

      // Start pulse animation
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.2, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isVisible, showTutorial]);

  // Update spotlight position when step changes
  useEffect(() => {
    if (currentTarget) {
      const centerX = currentTarget.x + currentTarget.width / 2;
      const centerY = currentTarget.y + currentTarget.height / 2;

      spotlightX.value = withSpring(centerX, { damping: 20, stiffness: 200 });
      spotlightY.value = withSpring(centerY, { damping: 20, stiffness: 200 });
      spotlightWidth.value = withSpring(currentTarget.width + SPOTLIGHT_PADDING * 2, {
        damping: 20,
        stiffness: 200,
      });
      spotlightHeight.value = withSpring(currentTarget.height + SPOTLIGHT_PADDING * 2, {
        damping: 20,
        stiffness: 200,
      });

      // Reset and animate tooltip
      tooltipOpacity.value = 0;
      tooltipTranslateY.value = 15;
      tooltipOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      tooltipTranslateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    }
  }, [currentStep, currentTarget]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep === totalSteps - 1) {
      // Last step - animate out then complete
      overlayOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(handleComplete)();
      });
      tooltipOpacity.value = withTiming(0, { duration: 200 });
    } else {
      nextStep();
      // Re-measure after step change
      setTimeout(() => {
        measureTargets();
      }, 50);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    skipTutorial();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    overlayOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(handleComplete)();
    });
    tooltipOpacity.value = withTiming(0, { duration: 200 });
  };

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ translateY: tooltipTranslateY.value }],
  }));

  // SVG animated props for spotlight (rounded rectangle)
  const BORDER_RADIUS = 16; // Match app's border radius

  const spotlightProps = useAnimatedProps(() => ({
    x: spotlightX.value - spotlightWidth.value / 2,
    y: spotlightY.value - spotlightHeight.value / 2,
    width: spotlightWidth.value,
    height: spotlightHeight.value,
    rx: BORDER_RADIUS,
    ry: BORDER_RADIUS,
  }));

  const pulseProps = useAnimatedProps(() => ({
    x: spotlightX.value - spotlightWidth.value / 2 - 6,
    y: spotlightY.value - spotlightHeight.value / 2 - 6,
    width: spotlightWidth.value + 12,
    height: spotlightHeight.value + 12,
    rx: BORDER_RADIUS + 4,
    ry: BORDER_RADIUS + 4,
    fillOpacity: pulseOpacity.value,
  }));

  // Calculate tooltip position (below or above spotlight)
  const getTooltipPosition = () => {
    if (!currentTarget) {
      return { top: SCREEN_HEIGHT / 2 };
    }

    const spotlightBottom = currentTarget.y + currentTarget.height + SPOTLIGHT_PADDING;
    const spaceBelow = SCREEN_HEIGHT - spotlightBottom;
    const tooltipHeight = 180; // Approximate tooltip height

    // If enough space below, position below; otherwise position above
    if (spaceBelow > tooltipHeight + 40) {
      return { top: spotlightBottom + 24 };
    } else {
      return { top: currentTarget.y - SPOTLIGHT_PADDING - tooltipHeight - 24 };
    }
  };

  if (!isVisible) return null;

  const tooltipPosition = getTooltipPosition();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Overlay with spotlight cutout */}
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
            <Defs>
              <Mask id="spotlight-mask">
                {/* White = visible, Black = hidden */}
                <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Spotlight cutout (rounded rectangle) */}
                <AnimatedRect
                  animatedProps={spotlightProps}
                  fill="black"
                />
              </Mask>
            </Defs>

            {/* Dark overlay with mask */}
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.88)"
              mask="url(#spotlight-mask)"
            />

            {/* Pulse glow effect */}
            <AnimatedRect
              animatedProps={pulseProps}
              fill={theme.colors.accent.primary}
            />
          </Svg>
        </Animated.View>

        {/* Tooltip */}
        <Animated.View
          style={[
            styles.tooltip,
            tooltipStyle,
            {
              backgroundColor: theme.colors.surface.level2,
              borderColor: theme.colors.border.subtle,
              ...tooltipPosition,
            },
          ]}
        >
          {/* Step indicator dots */}
          <View style={styles.dotsContainer}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentStep
                        ? theme.colors.accent.primary
                        : theme.colors.text.muted,
                    opacity: index === currentStep ? 1 : 0.4,
                  },
                ]}
              />
            ))}
          </View>

          {/* Title */}
          <AppText
            style={[
              styles.title,
              { color: theme.colors.text.primary },
            ]}
          >
            {currentStepData?.title}
          </AppText>

          {/* Description */}
          <AppText
            style={[
              styles.description,
              { color: theme.colors.text.secondary },
            ]}
          >
            {currentStepData?.description}
          </AppText>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <AppText
                style={[
                  styles.skipText,
                  { color: theme.colors.text.muted },
                ]}
              >
                Skip
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.nextButton,
                { backgroundColor: theme.colors.accent.primary },
              ]}
              activeOpacity={0.8}
            >
              <AppText style={styles.nextText}>
                {currentStep === totalSteps - 1 ? "Done" : "Next"}
              </AppText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    left: 24,
    width: TOOLTIP_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  nextText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
