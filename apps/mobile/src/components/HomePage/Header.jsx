import React, { useRef } from "react";
import { View, TextInput, Keyboard, TouchableOpacity } from "react-native";
import { Search, ArrowLeft, X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function Header({
  insets,
  searchQuery,
  onSearchChange,
  title = "Thoughts",
  showBackButton = false,
  onBackPress,
  backLabel = "Back",
}) {
  const { theme } = useTheme();
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
        paddingTop: insets.top + theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {/* Back button or Welcome Message */}
      {showBackButton ? (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBackPress?.();
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: theme.spacing.md,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.colors.accent.primary} />
          <AppText
            variant="body"
            style={{ color: theme.colors.accent.primary, marginLeft: theme.spacing.xs }}
          >
            {backLabel}
          </AppText>
        </TouchableOpacity>
      ) : (
        <AppText
          variant="caption"
          color="secondary"
          style={{ marginBottom: theme.spacing.xs }}
        >
          Welcome back, {firstName}
        </AppText>
      )}

      {/* Title */}
      <AppText
        variant="display"
        color="primary"
        style={{ marginBottom: theme.spacing.lg }}
      >
        {title}
      </AppText>

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
          placeholder={`Search ${title.toLowerCase()}...`}
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
        {searchQuery?.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
            <X size={18} color={theme.colors.text.muted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
