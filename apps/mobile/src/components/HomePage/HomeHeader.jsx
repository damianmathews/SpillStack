import React from "react";
import { View, TextInput, Keyboard, TouchableOpacity, Image } from "react-native";
import { Search, X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function HomeHeader({ insets, searchQuery, onSearchChange, activeTag, onClearTag }) {
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
        paddingBottom: 4,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {/* Centered Logo - 25% smaller */}
      <View style={{ alignItems: "center", marginBottom: 12, marginTop: 0 }}>
        <Image
          source={
            isDark
              ? require("../../../assets/spillstack-logo-white.png")
              : require("../../../assets/spillstack-logo-black.png")
          }
          style={{
            width: 495,
            height: 124,
          }}
          resizeMode="contain"
        />
        <AppText variant="subtitle" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontWeight: "600", marginTop: 2 }}>
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
