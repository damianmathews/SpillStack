import React from "react";
import { View, TextInput, Keyboard, TouchableOpacity, Image } from "react-native";
import { Search, Settings, X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function HomeHeader({ insets, searchQuery, onSearchChange, onSettingsPress }) {
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
        paddingTop: insets.top + theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {/* Top row: Logo + Welcome on left, Settings on right */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: theme.spacing.lg,
        }}
      >
        {/* Logo and Welcome text stacked on left */}
        <View style={{ flex: 1, alignItems: "flex-start" }}>
          <Image
            source={
              isDark
                ? require("../../../assets/spillstack-logo-white.png")
                : require("../../../assets/spillstack-logo-black.png")
            }
            style={{
              width: 360,
              height: 90,
              marginLeft: -20,
              marginBottom: theme.spacing.xs,
            }}
            resizeMode="contain"
          />
          <AppText variant="caption" style={{ color: "#FFFFFF" }}>
            Welcome back, {firstName}
          </AppText>
        </View>

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
            marginTop: theme.spacing.sm,
          }}
          activeOpacity={0.7}
        >
          <Settings size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
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
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search everything..."
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
