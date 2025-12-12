import React from "react";
import { View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Clock, Mic, Type, Link } from "lucide-react-native";
import { useTheme, categoryColors } from "@/contexts/ThemeContext";
import { AppText, AppChip } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function IdeaCard({ idea, onNavigate }) {
  const { theme } = useTheme();

  // Get category color with fallback
  const getCategoryColor = (categoryName) => {
    return categoryColors[categoryName] || theme.colors.accent.primary;
  };

  const categoryColor = getCategoryColor(idea.category);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // If onNavigate is provided (e.g., from a sheet), call it first to close the sheet
    if (onNavigate) {
      onNavigate();
    }
    router.push(`/idea/${idea.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getSourceIcon = () => {
    const iconProps = { size: 12, color: theme.colors.text.muted, strokeWidth: 2 };
    switch (idea.source_type) {
      case "voice":
        return <Mic {...iconProps} />;
      case "url":
        return <Link {...iconProps} />;
      default:
        return <Type {...iconProps} />;
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        flex: 1,
        marginHorizontal: theme.spacing.sm,
        marginBottom: theme.spacing.md,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          overflow: "hidden",
          height: 180,
          ...theme.elevation.low,
        }}
      >
        {/* Content */}
        <View style={{ padding: theme.spacing.lg, flex: 1 }}>
          {/* Category chip */}
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: `${categoryColor}15`,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              marginBottom: theme.spacing.md,
            }}
          >
            <AppText
              variant="caption"
              style={{
                color: categoryColor,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: "500",
              }}
            >
              {idea.category}
            </AppText>
          </View>

          {/* Title */}
          <AppText
            variant="title"
            color="primary"
            numberOfLines={2}
            style={{
              marginBottom: theme.spacing.sm,
              fontSize: 16,
              lineHeight: 22,
            }}
          >
            {idea.title}
          </AppText>

          {/* Summary - only show if there's room */}
          {idea.summary && (
            <AppText
              variant="body"
              color="secondary"
              numberOfLines={1}
              style={{ fontSize: 13, lineHeight: 18 }}
            >
              {idea.summary}
            </AppText>
          )}
        </View>

        {/* Footer - positioned absolutely at bottom */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.subtle,
            backgroundColor: theme.colors.surface.level1,
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}
          >
            {getSourceIcon()}
            <Clock size={12} color={theme.colors.text.muted} strokeWidth={2} />
            <AppText variant="caption" color="muted">
              {formatDate(idea.created_at)}
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
