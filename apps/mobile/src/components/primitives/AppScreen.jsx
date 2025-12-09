import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * AppScreen - Screen container with safe area handling
 *
 * @param {boolean} withGradient - Reserved for future use
 * @param {string} variant - Screen variant: default | alt
 */
export function AppScreen({
  children,
  withGradient = false,
  variant = "default",
  style,
  ...props
}) {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    return variant === "alt"
      ? theme.colors.background.alt
      : theme.colors.background.default;
  };

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default AppScreen;
