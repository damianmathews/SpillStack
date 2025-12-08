import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * AppScreen - Screen container with safe area handling
 *
 * @param {boolean} withGradient - Show subtle header gradient
 * @param {string} variant - Screen variant: default | alt
 */
export function AppScreen({
  children,
  withGradient = false,
  variant = "default",
  style,
  ...props
}) {
  const { theme, gradients, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
      {withGradient && (
        <LinearGradient
          colors={[
            isDark ? "rgba(79, 125, 255, 0.15)" : "rgba(79, 125, 255, 0.08)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 300,
          }}
        />
      )}
      {children}
    </View>
  );
}

export default AppScreen;
