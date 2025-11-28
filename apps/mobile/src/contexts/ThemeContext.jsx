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

// Light theme
const lightTheme = {
  mode: "light",
  colors: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    card: "#FFFFFF",
    text: "#0F172A",
    textSecondary: "#64748B",
    textTertiary: "#94A3B8",
    border: "#E2E8F0",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
  },
  gradients: {
    primary: ["#6366F1", "#8B5CF6"],
    secondary: ["#8B5CF6", "#EC4899"],
    accent: ["#06B6D4", "#3B82F6"],
    warm: ["#F59E0B", "#EF4444"],
    cool: ["#10B981", "#06B6D4"],
  },
  shadows: {
    small: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

// Dark theme
const darkTheme = {
  mode: "dark",
  colors: {
    primary: "#818CF8",
    secondary: "#A78BFA",
    background: "#0F172A",
    surface: "#1E293B",
    card: "#334155",
    text: "#F1F5F9",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    border: "#475569",
    error: "#F87171",
    success: "#34D399",
    warning: "#FBBF24",
    info: "#60A5FA",
  },
  gradients: {
    primary: ["#818CF8", "#A78BFA"],
    secondary: ["#A78BFA", "#F472B6"],
    accent: ["#22D3EE", "#60A5FA"],
    warm: ["#FBBF24", "#F87171"],
    cool: ["#34D399", "#22D3EE"],
  },
  shadows: {
    small: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
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
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
