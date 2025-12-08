import React from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { useTheme, categoryColors } from "@/contexts/ThemeContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

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
    <View style={{ paddingVertical: theme.spacing.md }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          gap: theme.spacing.sm,
        }}
      >
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category.name;

          return (
            <TouchableOpacity
              key={category.name}
              onPress={() => handleSelect(category.name)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: theme.spacing.lg,
                height: theme.componentHeight.chip,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: theme.radius.pill,
                backgroundColor: isSelected
                  ? theme.colors.accent.softBg
                  : theme.colors.surface.level1,
                borderWidth: 1,
                borderColor: isSelected
                  ? theme.colors.accent.softBorder
                  : theme.colors.border.subtle,
              }}
            >
              <AppText
                variant="subtitle"
                style={{
                  color: isSelected
                    ? theme.colors.text.primary
                    : theme.colors.text.secondary,
                  letterSpacing: 0,
                  textTransform: "none",
                }}
              >
                {category.name}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
