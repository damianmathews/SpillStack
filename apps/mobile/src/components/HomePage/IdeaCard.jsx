import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Clock, Eye, Mic, Type, Link } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

export function IdeaCard({ idea }) {
  const { theme } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const getCategoryColor = (category) => {
    const categoryMap = {
      Ideas: "#9C27B0",
      Learning: "#3F51B5",
      Projects: "#009688",
      Research: "#FF5722",
      Personal: "#E91E63",
      "Business Ideas": "#673AB7",
      "To Do": "#00BCD4",
    };
    return categoryMap[category] || theme.colors.primary;
  };

  const getSourceIcon = () => {
    switch (idea.source_type) {
      case "voice":
        return <Mic size={10} color={theme.colors.textTertiary} />;
      case "url":
        return <Link size={10} color={theme.colors.textTertiary} />;
      default:
        return <Type size={10} color={theme.colors.textTertiary} />;
    }
  };

  const categoryColor = getCategoryColor(idea.category);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        flex: 1,
        marginHorizontal: 6,
        marginBottom: 12,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: "hidden",
          minHeight: 160,
        }}
      >
        {/* Category indicator */}
        <View
          style={{
            height: 3,
            backgroundColor: categoryColor,
          }}
        />

        {/* Content */}
        <View style={{ padding: 14, flex: 1 }}>
          {/* Category badge */}
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: `${categoryColor}15`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: categoryColor,
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              {idea.category}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: theme.colors.text,
              marginBottom: 6,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {idea.title}
          </Text>

          {/* Summary */}
          {idea.summary && (
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.textSecondary,
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {idea.summary}
            </Text>
          )}

          <View style={{ flex: 1 }} />

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {getSourceIcon()}
              <Clock size={10} color={theme.colors.textTertiary} />
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.textTertiary,
                  fontWeight: "500",
                }}
              >
                {formatDate(idea.created_at)}
              </Text>
            </View>

            {idea.view_count > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Eye size={10} color={theme.colors.textTertiary} />
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.textTertiary,
                    fontWeight: "500",
                  }}
                >
                  {idea.view_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
