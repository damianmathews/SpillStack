import React, { useState, useRef } from "react";
import { View, TextInput, Keyboard, TouchableOpacity } from "react-native";
import { Search, X, Settings } from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function HomeHeader({ insets, searchQuery, onSearchChange, activeTag, onClearTag }) {
  const { theme } = useTheme();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSearchChange("");
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/settings-modal");
  };

  return (
    <View
      style={{
        paddingTop: insets.top + theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {/* Single row: Search | Settings */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        {/* Search Bar - full width */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.surface.level1,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.spacing.md,
            height: 44,
            borderWidth: 1,
            borderColor: isSearchFocused
              ? theme.colors.accent.primary
              : theme.colors.border.subtle,
          }}
        >
          <Search size={18} color={theme.colors.text.muted} strokeWidth={2} />

          {/* Active Tag Chip */}
          {activeTag && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClearTag?.();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.colors.accent.softBg,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 2,
                borderRadius: theme.radius.pill,
                marginLeft: theme.spacing.sm,
                gap: 4,
              }}
              activeOpacity={0.7}
            >
              <AppText variant="caption" style={{ color: theme.colors.accent.primary, fontSize: 11 }}>
                #{activeTag}
              </AppText>
              <X size={10} color={theme.colors.accent.primary} strokeWidth={2} />
            </TouchableOpacity>
          )}

          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={activeTag ? "Filter..." : "Search ideas and tasks..."}
            placeholderTextColor={theme.colors.text.muted}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            blurOnSubmit={true}
            style={{
              flex: 1,
              marginLeft: theme.spacing.sm,
              fontSize: 15,
              color: theme.colors.text.primary,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
              <X size={18} color={theme.colors.text.muted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Button */}
        <TouchableOpacity
          onPress={handleSettingsPress}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surface.level1,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
          activeOpacity={0.7}
        >
          <Settings size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
