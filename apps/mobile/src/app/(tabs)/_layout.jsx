import React from "react";
import { View } from "react-native";
import { Slot } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

// Simple layout - no bottom tabs, just render the content
export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
      <Slot />
    </View>
  );
}
