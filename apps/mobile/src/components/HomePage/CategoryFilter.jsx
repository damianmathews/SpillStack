import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
  theme,
}) {
  const allCategories = ["All", ...categories.map((c) => c.name)];

  const getCategoryGradient = (categoryName) => {
    if (categoryName === "All") return theme.gradients.primary;

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

    return categoryMap[categoryName] || theme.gradients.primary;
  };

  return (
    <View style={{ paddingVertical: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 12,
        }}
      >
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category;
          const gradient = getCategoryGradient(category);

          if (isSelected) {
            return (
              <LinearGradient
                key={category}
                colors={gradient}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 25,
                  minWidth: 80,
                  alignItems: "center",
                  ...theme.shadows.small,
                }}
              >
                <TouchableOpacity onPress={() => onCategorySelect(category)}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            );
          }

          return (
            <TouchableOpacity
              key={category}
              onPress={() => onCategorySelect(category)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 25,
                backgroundColor: theme.colors.card,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                minWidth: 80,
                alignItems: "center",
                ...theme.shadows.small,
              }}
            >
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
