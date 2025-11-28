import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Clock, Eye, CheckSquare, Square } from "lucide-react-native";

export function IdeaCard({ idea, categoryColor, theme }) {
  const handlePress = () => {
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

  const getCategoryGradient = (category) => {
    const categoryMap = {
      Ideas: theme.gradients.primary,
      Learning: theme.gradients.cool,
      Projects: theme.gradients.accent,
      Inspiration: theme.gradients.warm,
      Research: theme.gradients.secondary,
      Personal: theme.gradients.primary,
      "To Do": ["#FF6B6B", "#FF8E8E"],
      "Business Ideas": ["#4ECDC4", "#6EDDD6"],
      "Life Hacks": ["#45B7D1", "#67C3DB"],
      Technology: ["#DDA0DD", "#E6B8E6"],
      "Health & Wellness": ["#98FB98", "#ADFCAD"],
      Travel: ["#F4A460", "#F6B481"],
      Finance: ["#20B2AA", "#4BC4BC"],
      "Personal Growth": ["#FF8C94", "#FFA3AA"],
      "Creative Projects": ["#B8860B", "#C99A2E"],
    };
    return categoryMap[category] || theme.gradients.primary;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        flex: 1,
        marginHorizontal: 4,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: 20,
          overflow: "hidden",
          ...theme.shadows.medium,
          minHeight: 180,
        }}
      >
        {/* Category gradient header */}
        <LinearGradient
          colors={getCategoryGradient(idea.category)}
          style={{
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {idea.category}
          </Text>

          {idea.category === "To Do" && (
            <View>
              {idea.completed ? (
                <CheckSquare size={14} color="#FFFFFF" />
              ) : (
                <Square size={14} color="#FFFFFF" />
              )}
            </View>
          )}
        </LinearGradient>

        {/* Content */}
        <View style={{ padding: 16, flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: theme.colors.text,
              marginBottom: 8,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {idea.title}
          </Text>

          {idea.summary && (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                lineHeight: 16,
                marginBottom: 12,
              }}
              numberOfLines={3}
            >
              {idea.summary}
            </Text>
          )}

          {/* Tags */}
          {idea.tags && idea.tags.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 8,
              }}
            >
              {idea.tags.slice(0, 1).map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: `${theme.colors.primary}15`,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    #{tag}
                  </Text>
                </View>
              ))}
              {idea.tags.length > 1 && (
                <View
                  style={{
                    backgroundColor: `${theme.colors.textTertiary}15`,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.textTertiary,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    +{idea.tags.length - 1}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ flex: 1 }} />

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Clock size={11} color={theme.colors.textTertiary} />
              <Text
                style={{
                  fontSize: 10,
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
                <Eye size={11} color={theme.colors.textTertiary} />
                <Text
                  style={{
                    fontSize: 10,
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
