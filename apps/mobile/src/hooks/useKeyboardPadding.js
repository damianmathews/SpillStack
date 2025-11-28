import { useRef } from "react";
import { Animated, Platform } from "react-native";

export function useKeyboardPadding(insets, focusedPadding = 12) {
  const paddingAnimation = useRef(
    new Animated.Value(insets.bottom + focusedPadding),
  ).current;

  const animateTo = (value) => {
    Animated.timing(paddingAnimation, {
      toValue: value,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputFocus = () => {
    if (Platform.OS === "web") return;
    animateTo(focusedPadding);
  };

  const handleInputBlur = () => {
    if (Platform.OS === "web") return;
    animateTo(insets.bottom + focusedPadding);
  };

  return {
    paddingAnimation,
    handleInputFocus,
    handleInputBlur,
  };
}
