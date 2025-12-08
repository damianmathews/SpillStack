import React from "react";
import { View, TextInput, Keyboard, TouchableOpacity, Image } from "react-native";
import { Search, Settings, X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function HomeHeader({ insets, searchQuery, onSearchChange, onSettingsPress, activeTag, onClearTag }) {
  const { theme, isDark } = useTheme();
  const { user } = useFirebaseAuth();

  // Get first name from display name (Google accounts have full name)
  const firstName = user?.displayName?.split(" ")[0] || "there";

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSearchChange("");
  };

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {/* Top row: Settings button on right */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          marginBottom: 0,
        }}
      >
        {/* Settings button */}
        <TouchableOpacity
          onPress={onSettingsPress}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
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

      {/* Centered Logo */}
      <View style={{ alignItems: "center", marginBottom: theme.spacing.sm, marginTop: -10 }}>
        <Image
          source={
            isDark
              ? require("../../../assets/spillstack-logo-white.png")
              : require("../../../assets/spillstack-logo-black.png")
          }
          style={{
            width: 660,
            height: 165,
          }}
          resizeMode="contain"
        />
        <AppText variant="subtitle" style={{ color: "#FFFFFF", fontWeight: "600", marginTop: theme.spacing.xs }}>
          Welcome back, {firstName}
        </AppText>
      </View>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.lg,
          paddingHorizontal: theme.spacing.lg,
          height: theme.componentHeight.input,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
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
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.pill,
              marginLeft: theme.spacing.sm,
              gap: theme.spacing.xs,
            }}
            activeOpacity={0.7}
          >
            <AppText variant="caption" style={{ color: theme.colors.accent.primary }}>
              #{activeTag}
            </AppText>
            <X size={12} color={theme.colors.accent.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}

        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={activeTag ? "Add more filters..." : "Search everything..."}
          placeholderTextColor={theme.colors.text.muted}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          blurOnSubmit={true}
          style={{
            flex: 1,
            marginLeft: theme.spacing.md,
            ...theme.typography.body,
            color: theme.colors.text.primary,
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
            <X size={18} color={theme.colors.text.muted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
