import React, { useRef, useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { useTheme, categoryColors } from "@/contexts/ThemeContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function CategoryFilter({
  categories = [],
  selectedCategory,
  onCategorySelect,
  scrollToSelected = false,
}) {
  const { theme } = useTheme();
  const scrollViewRef = useRef(null);
  const [itemLayouts, setItemLayouts] = useState({});

  const allCategories = [
    { name: "All" },
    ...categories.filter((c) => c.name !== "All"),
  ];

  // Scroll to selected category when scrollToSelected changes or selectedCategory changes
  useEffect(() => {
    if (scrollToSelected && selectedCategory && selectedCategory !== "All") {
      const selectedIndex = allCategories.findIndex(c => c.name === selectedCategory);
      if (selectedIndex > 0 && itemLayouts[selectedCategory]) {
        // Scroll to make the selected item visible (centered if possible)
        const layout = itemLayouts[selectedCategory];
        const scrollX = Math.max(0, layout.x - 100); // Offset to show some items before
        scrollViewRef.current?.scrollTo({ x: scrollX, animated: true });
      }
    }
  }, [scrollToSelected, selectedCategory, itemLayouts]);

  const handleSelect = (category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategorySelect(category);
  };

  // Get category color with fallback
  const getCategoryColor = (categoryName) => {
    return categoryColors[categoryName] || theme.colors.accent.primary;
  };

  const handleItemLayout = (categoryName, event) => {
    const { x, width } = event.nativeEvent.layout;
    setItemLayouts(prev => ({
      ...prev,
      [categoryName]: { x, width }
    }));
  };

  return (
    <View style={{ paddingVertical: theme.spacing.md }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          gap: theme.spacing.sm,
        }}
      >
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category.name;
          const categoryColor = getCategoryColor(category.name);

          return (
            <TouchableOpacity
              key={category.name}
              onLayout={(e) => handleItemLayout(category.name, e)}
              onPress={() => handleSelect(category.name)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: theme.spacing.lg,
                height: theme.componentHeight.chip,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: theme.radius.pill,
                backgroundColor: isSelected
                  ? `${categoryColor}15`
                  : theme.colors.surface.level1,
                borderWidth: 1,
                borderColor: isSelected
                  ? categoryColor
                  : theme.colors.border.subtle,
              }}
            >
              <AppText
                variant="subtitle"
                style={{
                  color: isSelected
                    ? categoryColor
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
