import React, { useState, useCallback } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { useIdeas } from "@/hooks/useIdeas";
import { useCategories } from "@/hooks/useCategories";
import { Header } from "@/components/HomePage/Header";
import { CategoryFilter } from "@/components/HomePage/CategoryFilter";
import { IdeasGrid } from "@/components/HomePage/IdeasGrid";
import { AddIdeaModal } from "@/components/AddIdeaModal/AddIdeaModal";
import { useTheme } from "@/contexts/ThemeContext";

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme, isDark } = useTheme();

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch ideas and categories
  const { data: ideas = [], isLoading } = useIdeas(
    selectedCategory,
    searchQuery,
  );
  const { data: categories = [] } = useCategories();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["ideas"] });
    setRefreshing(false);
  }, [queryClient]);

  const getCategoryColor = (categoryName) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || theme.colors.primary;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Beautiful gradient background */}
      <LinearGradient
        colors={
          isDark
            ? [theme.colors.background, theme.colors.surface]
            : [theme.colors.background, theme.colors.surface]
        }
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
          <Header
            insets={insets}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddPress={() => setShowAddModal(true)}
            theme={theme}
          />

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            theme={theme}
          />

          <IdeasGrid
            ideas={ideas}
            isLoading={isLoading}
            insets={insets}
            refreshing={refreshing}
            onRefresh={onRefresh}
            getCategoryColor={getCategoryColor}
            theme={theme}
          />
        </KeyboardAvoidingAnimatedView>
      </LinearGradient>

      <AddIdeaModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}
