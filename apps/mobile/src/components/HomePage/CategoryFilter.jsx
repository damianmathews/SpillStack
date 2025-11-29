import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

const categoryColors = {
  All: "#E91E63",
  Ideas: "#9C27B0",
  Learning: "#3F51B5",
  Projects: "#009688",
  Research: "#FF5722",
  Personal: "#E91E63",
  "Business Ideas": "#673AB7",
  "To Do": "#00BCD4",
};

export function CategoryFilter({
  categories = [],
  selectedCategory,
  onCategorySelect,
}) {
  const { theme } = useTheme();

  const allCategories = [
    { name: "All" },
    ...categories.filter((c) => c.name !== "All"),
  ];

  const handleSelect = (category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategorySelect(category);
  };

  return (
    <View style={{ paddingVertical: 12 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
        }}
      >
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category.name;
          const color = categoryColors[category.name] || theme.colors.primary;

          return (
            <TouchableOpacity
              key={category.name}
              onPress={() => handleSelect(category.name)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isSelected ? color : theme.colors.surface,
                borderWidth: 1,
                borderColor: isSelected ? color : theme.colors.border,
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#FFFFFF" : theme.colors.textSecondary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
