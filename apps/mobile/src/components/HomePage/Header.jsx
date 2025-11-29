import React from "react";
import { View, Text, TextInput } from "react-native";
import { Search } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

export function Header({ insets, searchQuery, onSearchChange, title = "Ideas" }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Title */}
      <Text
        style={{
          ...theme.typography.largeTitle,
          color: theme.colors.text,
          marginBottom: 16,
        }}
      >
        {title}
      </Text>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Search size={18} color={theme.colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search..."
          placeholderTextColor={theme.colors.textTertiary}
          style={{
            flex: 1,
            marginLeft: 10,
            fontSize: 16,
            color: theme.colors.text,
          }}
        />
      </View>
    </View>
  );
}
