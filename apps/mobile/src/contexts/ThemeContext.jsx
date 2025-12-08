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

// =============================================================================
// EDITORIAL PRODUCTIVITY DESIGN SYSTEM
// Dark, professional, calm ambient gradients - Linear/Notion/Raycast aesthetic
// =============================================================================

// Color tokens - exact spec values
const colors = {
  dark: {
    // Background hierarchy
    background: {
      default: "#050811",
      alt: "#070C18",
    },

    // Surface elevation
    surface: {
      level1: "#0C1220",
      level2: "#131A2B",
      level3: "#181F30",
    },

    // Borders
    border: {
      subtle: "#222B3D",
    },

    // Text hierarchy
    text: {
      primary: "#F4F6FF",
      secondary: "#B7C0D8",
      muted: "#818BA3",
    },

    // Accent colors
    accent: {
      primary: "#4F7DFF",
      secondary: "#22C8C2",
      softBg: "#101B36",
      softBorder: "#304272",
    },

    // Status
    success: "#22C55E",
    warning: "#FBBF24",
    danger: "#FB7185",

    // Legacy mappings for backward compatibility
    card: "#0C1220",
    primary: "#4F7DFF",
    secondary: "#22C8C2",
    error: "#FB7185",
    textSecondary: "#B7C0D8",
    textTertiary: "#818BA3",
  },
  light: {
    // Light mode - professional light theme
    background: {
      default: "#F8FAFC",
      alt: "#F1F5F9",
    },
    surface: {
      level1: "#FFFFFF",
      level2: "#F8FAFC",
      level3: "#F1F5F9",
    },
    border: {
      subtle: "#E2E8F0",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      muted: "#94A3B8",
    },
    accent: {
      primary: "#4F7DFF",
      secondary: "#14B8A6",
      softBg: "#EEF4FF",
      softBorder: "#BFDBFE",
    },
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#F43F5E",
    // Legacy mappings
    card: "#FFFFFF",
    primary: "#4F7DFF",
    secondary: "#14B8A6",
    error: "#F43F5E",
    textSecondary: "#475569",
    textTertiary: "#94A3B8",
  },
};

// Gradients - controlled ambient flavor
export const gradients = {
  accent: ["#4F7DFF", "#22C8C2"],
  header: ["rgba(79, 125, 255, 0.2)", "transparent"],
  fab: ["#22C55E", "#FFFFFF"],
  surface: {
    dark: ["#131A2B", "#0C1220"],
    light: ["#FFFFFF", "#F8FAFC"],
  },
};

// Category colors
export const categoryColors = {
  All: "#4F7DFF",
  Projects: "#14B8A6",
  Research: "#F97316",
  Personal: "#EC4899",
  "Business Ideas": "#8B5CF6",
  Creative: "#F59E0B",
  "To Do": "#06B6D4",
};

// 8pt spacing system
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Border radius
const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

// Component heights
const componentHeight = {
  input: 48,
  button: 48,
  buttonSmall: 40,
  chip: 32,
  iconButton: 40,
  iconButtonSmall: 32,
  tabBar: 84,
  fab: 56,
};

// Typography scale
const typography = {
  display: {
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: 0,
  },
  // Legacy mappings
  largeTitle: {
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  title2: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  title3: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0,
  },
  headline: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    letterSpacing: 0,
  },
  subhead: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: 0,
  },
  subheadMedium: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: 0,
  },
  footnote: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    letterSpacing: 0,
  },
  footnoteMedium: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption1: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption1Medium: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: "400",
    lineHeight: 14,
    letterSpacing: 0.2,
  },
};

// Elevation / shadows
const elevation = {
  none: {},
  low: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  mid: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  high: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Motion tokens
const motion = {
  fast: 150,
  normal: 220,
  slow: 280,
};

// Build theme object
const buildTheme = (mode) => ({
  mode,
  colors: colors[mode],
  gradients,
  categoryColors,
  spacing,
  radius,
  borderRadius: radius, // alias for backward compatibility
  componentHeight,
  typography,
  elevation,
  shadows: { // alias for backward compatibility
    [mode]: elevation,
  },
  motion,
});

const darkTheme = buildTheme("dark");
const lightTheme = buildTheme("light");

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("@theme_preference");
      // Default to dark mode, only switch to light if explicitly saved as "light"
      if (savedTheme === "light") {
        setIsDark(false);
      } else {
        // Dark mode is the default
        setIsDark(true);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
      setIsDark(true); // Default to dark on error
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
    categoryColors,
    gradients,
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
