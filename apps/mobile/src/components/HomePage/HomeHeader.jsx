import React, { useState, useRef } from "react";
import { View, TextInput, Keyboard, TouchableOpacity, Image } from "react-native";
import { Search, X, Settings } from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function HomeHeader({ insets, searchQuery, onSearchChange, activeTag, onClearTag }) {
  const { theme, isDark } = useTheme();
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
      {/* Single row: Logo | Search | Settings */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        {/* Logo - compact */}
        <Image
          source={
            isDark
              ? require("../../../assets/spillstack-logo-white.png")
              : require("../../../assets/spillstack-logo-black.png")
          }
          style={{
            width: 140,
            height: 35,
          }}
          resizeMode="contain"
        />

        {/* Search Bar - flexible width */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.surface.level1,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.spacing.md,
            height: 40,
            borderWidth: 1,
            borderColor: isSearchFocused
              ? theme.colors.accent.primary
              : theme.colors.border.subtle,
          }}
        >
          <Search size={16} color={theme.colors.text.muted} strokeWidth={2} />

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
                marginLeft: theme.spacing.xs,
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
            placeholder={activeTag ? "Filter..." : "Search..."}
            placeholderTextColor={theme.colors.text.muted}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            blurOnSubmit={true}
            style={{
              flex: 1,
              marginLeft: theme.spacing.sm,
              fontSize: 14,
              color: theme.colors.text.primary,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
              <X size={16} color={theme.colors.text.muted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Button */}
        <TouchableOpacity
          onPress={handleSettingsPress}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surface.level1,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
          activeOpacity={0.7}
        >
          <Settings size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
