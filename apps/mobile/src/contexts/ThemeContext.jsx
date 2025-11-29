import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// SpillStack Dark Theme - Premium, Framer-inspired
const darkTheme = {
  mode: "dark",
  colors: {
    // Core
    background: "#0A0A0B",
    surface: "#141416",
    card: "#1C1C1F",
    cardHover: "#242428",

    // Accent
    primary: "#E91E63",
    primaryLight: "#F8BBD9",
    primaryDark: "#AD1457",
    secondary: "#00BFA5",
    secondaryLight: "#64FFDA",

    // Text
    text: "#FFFFFF",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    textMuted: "#4B5563",

    // Borders
    border: "#2A2A2E",
    borderLight: "#3A3A3F",

    // Status
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",

    // Special
    overlay: "rgba(0, 0, 0, 0.7)",
    glass: "rgba(28, 28, 31, 0.8)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
  },
  gradients: {
    primary: ["#E91E63", "#AD1457"],
    secondary: ["#00BFA5", "#00897B"],
    accent: ["#7C3AED", "#4F46E5"],
    surface: ["#1C1C1F", "#141416"],
    card: ["rgba(28, 28, 31, 0.9)", "rgba(20, 20, 22, 0.9)"],
    pink: ["#E91E63", "#EC407A"],
    teal: ["#00BFA5", "#26A69A"],
  },
  shadows: {
    small: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
    },
    glow: {
      shadowColor: "#E91E63",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    largeTitle: {
      fontSize: 34,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    title1: {
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    title2: {
      fontSize: 22,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    title3: {
      fontSize: 20,
      fontWeight: "600",
    },
    headline: {
      fontSize: 17,
      fontWeight: "600",
    },
    body: {
      fontSize: 17,
      fontWeight: "400",
    },
    callout: {
      fontSize: 16,
      fontWeight: "400",
    },
    subhead: {
      fontSize: 15,
      fontWeight: "400",
    },
    footnote: {
      fontSize: 13,
      fontWeight: "400",
    },
    caption1: {
      fontSize: 12,
      fontWeight: "400",
    },
    caption2: {
      fontSize: 11,
      fontWeight: "400",
    },
  },
};

// Light theme (keeping for toggle option, but dark is default)
const lightTheme = {
  mode: "light",
  colors: {
    background: "#F8F9FA",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    cardHover: "#F3F4F6",

    primary: "#E91E63",
    primaryLight: "#F8BBD9",
    primaryDark: "#AD1457",
    secondary: "#00BFA5",
    secondaryLight: "#B2DFDB",

    text: "#111827",
    textSecondary: "#4B5563",
    textTertiary: "#9CA3AF",
    textMuted: "#D1D5DB",

    border: "#E5E7EB",
    borderLight: "#F3F4F6",

    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",

    overlay: "rgba(0, 0, 0, 0.5)",
    glass: "rgba(255, 255, 255, 0.8)",
    glassBorder: "rgba(0, 0, 0, 0.08)",
  },
  gradients: {
    primary: ["#E91E63", "#AD1457"],
    secondary: ["#00BFA5", "#00897B"],
    accent: ["#7C3AED", "#4F46E5"],
    surface: ["#FFFFFF", "#F8F9FA"],
    card: ["rgba(255, 255, 255, 0.9)", "rgba(248, 249, 250, 0.9)"],
    pink: ["#E91E63", "#EC407A"],
    teal: ["#00BFA5", "#26A69A"],
  },
  shadows: {
    small: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 8,
    },
    glow: {
      shadowColor: "#E91E63",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  spacing: darkTheme.spacing,
  borderRadius: darkTheme.borderRadius,
  typography: darkTheme.typography,
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // Default to dark
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("@theme_preference");
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark ? "dark" : "light";
      await AsyncStorage.setItem("@theme_preference", newTheme);
      setIsDark(!isDark);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
    isLoading,
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
