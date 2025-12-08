import React from "react";
import { Text } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * AppText - Typography primitive using the design system
 *
 * @param {string} variant - Typography variant: display | title | subtitle | body | caption
 * @param {string} color - Text color: primary | secondary | muted | accent
 * @param {object} style - Additional styles
 */
export function AppText({
  children,
  variant = "body",
  color = "primary",
  style,
  numberOfLines,
  ...props
}) {
  const { theme } = useTheme();

  const getTypographyStyle = () => {
    return theme.typography[variant] || theme.typography.body;
  };

  const getColorValue = () => {
    switch (color) {
      case "primary":
        return theme.colors.text.primary;
      case "secondary":
        return theme.colors.text.secondary;
      case "muted":
        return theme.colors.text.muted;
      case "accent":
        return theme.colors.accent.primary;
      case "success":
        return theme.colors.success;
      case "warning":
        return theme.colors.warning;
      case "danger":
        return theme.colors.danger;
      default:
        // Allow passing custom color
        if (color && color.startsWith("#")) {
          return color;
        }
        return theme.colors.text.primary;
    }
  };

  return (
    <Text
      style={[getTypographyStyle(), { color: getColorValue() }, style]}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </Text>
  );
}

export default AppText;
