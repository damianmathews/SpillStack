import React from "react";
import { TouchableOpacity, View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "./AppText";

/**
 * AppButton - Button primitive using the design system
 *
 * @param {string} variant - Button variant: primary | secondary | tertiary
 * @param {string} size - Button size: default | small
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable button
 */
export function AppButton({
  children,
  variant = "primary",
  size = "default",
  loading = false,
  disabled = false,
  onPress,
  leftIcon,
  rightIcon,
  style,
  ...props
}) {
  const { theme, gradients } = useTheme();

  const getButtonHeight = () => {
    return size === "small"
      ? theme.componentHeight.buttonSmall
      : theme.componentHeight.button;
  };

  const getButtonStyle = () => {
    const base = {
      height: getButtonHeight(),
      borderRadius: theme.radius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    };

    switch (variant) {
      case "primary":
        return {
          ...base,
          overflow: "hidden",
        };
      case "secondary":
        return {
          ...base,
          backgroundColor: theme.colors.surface.level1,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        };
      case "tertiary":
        return {
          ...base,
          backgroundColor: "transparent",
        };
      default:
        return base;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.text.muted;
    switch (variant) {
      case "primary":
        return "#FFFFFF";
      case "secondary":
        return theme.colors.text.primary;
      case "tertiary":
        return theme.colors.accent.primary;
      default:
        return theme.colors.text.primary;
    }
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon}
          {typeof children === "string" ? (
            <AppText
              variant="bodyMedium"
              style={{ color: getTextColor() }}
            >
              {children}
            </AppText>
          ) : (
            children
          )}
          {rightIcon}
        </>
      )}
    </>
  );

  const buttonStyle = [
    getButtonStyle(),
    disabled && { opacity: 0.5 },
    style,
  ];

  if (variant === "primary" && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={buttonStyle}
        {...props}
      >
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            ...buttonStyle[0],
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          {content}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={buttonStyle}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
}

export default AppButton;
