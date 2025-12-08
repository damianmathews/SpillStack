import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "./AppText";

/**
 * AppChip - Tag/pill primitive using the design system
 *
 * @param {string} variant - Chip variant: default | accent | muted
 * @param {boolean} selected - Whether chip is selected
 * @param {function} onPress - Press handler (makes chip pressable)
 */
export function AppChip({
  children,
  variant = "default",
  selected = false,
  onPress,
  leftIcon,
  style,
  ...props
}) {
  const { theme } = useTheme();

  const getChipStyle = () => {
    const base = {
      height: theme.componentHeight.chip,
      borderRadius: theme.radius.pill,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.xs,
    };

    if (selected) {
      return {
        ...base,
        backgroundColor: theme.colors.accent.softBg,
        borderWidth: 1,
        borderColor: theme.colors.accent.softBorder,
      };
    }

    switch (variant) {
      case "accent":
        return {
          ...base,
          backgroundColor: theme.colors.accent.softBg,
          borderWidth: 1,
          borderColor: theme.colors.accent.softBorder,
        };
      case "muted":
        return {
          ...base,
          backgroundColor: theme.colors.surface.level2,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        };
      default:
        return {
          ...base,
          backgroundColor: theme.colors.surface.level1,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        };
    }
  };

  const getTextColor = () => {
    if (selected) return theme.colors.text.primary;
    switch (variant) {
      case "accent":
        return theme.colors.accent.primary;
      case "muted":
        return theme.colors.text.muted;
      default:
        return theme.colors.text.secondary;
    }
  };

  const content = (
    <>
      {leftIcon}
      {typeof children === "string" ? (
        <AppText
          variant="caption"
          style={{ color: getTextColor() }}
        >
          {children}
        </AppText>
      ) : (
        children
      )}
    </>
  );

  const chipStyle = [getChipStyle(), style];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={chipStyle}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={chipStyle} {...props}>
      {content}
    </View>
  );
}

export default AppChip;
