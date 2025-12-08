import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * AppCard - Card container using the design system
 *
 * @param {string} variant - Card variant: default | highlighted | compact
 * @param {boolean} pressable - Whether the card is pressable
 * @param {function} onPress - Press handler
 */
export function AppCard({
  children,
  variant = "default",
  pressable = false,
  onPress,
  style,
  ...props
}) {
  const { theme } = useTheme();

  const getCardStyle = () => {
    const base = {
      backgroundColor: theme.colors.surface.level1,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      ...theme.elevation.low,
    };

    switch (variant) {
      case "highlighted":
        return {
          ...base,
          backgroundColor: theme.colors.surface.level2,
          borderColor: theme.colors.accent.softBorder,
        };
      case "compact":
        return {
          ...base,
          padding: theme.spacing.md,
        };
      default:
        return {
          ...base,
          padding: theme.spacing.lg,
        };
    }
  };

  const cardStyle = [getCardStyle(), style];

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

export default AppCard;
