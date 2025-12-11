import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Keyboard,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Search, Lightbulb } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { useIdeas } from "@/hooks/useIdeas";
import { useCategories } from "@/hooks/useCategories";
import { getStoredIdeas } from "@/hooks/useCreateIdea";
import { CategoryFilter } from "@/components/HomePage/CategoryFilter";
import { IdeaCard } from "@/components/HomePage/IdeaCard";
import { AppText } from "@/components/primitives";
import { categories as defaultCategories } from "@/data/sampleData";

export function IdeasSheet({ visible, onClose, initialCategory = "All" }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme, isDark } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Update category when initialCategory changes (e.g., opening from idea detail)
  React.useEffect(() => {
    if (visible && initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [visible, initialCategory]);

  // Fetch ideas and categories
  const { data: apiIdeas = [], isLoading } = useIdeas(selectedCategory, searchQuery);
  const { data: apiCategories = [] } = useCategories();

  // Fetch locally stored ideas
  const { data: localIdeas = [] } = useQuery({
    queryKey: ["localIdeas"],
    queryFn: getStoredIdeas,
  });

  // Use local ideas (no sample data)
  const ideas = apiIdeas.length > 0 ? apiIdeas : localIdeas;
  const baseCategories = apiCategories.length > 0 ? apiCategories : defaultCategories;

  // Sort categories by idea count (most popular first)
  const categories = useMemo(() => {
    // Count ideas per category
    const categoryCounts = {};
    ideas.forEach((idea) => {
      const cat = idea.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Sort categories by count (descending), keeping "All" always first
    return [...baseCategories].sort((a, b) => {
      if (a.name === "All") return -1;
      if (b.name === "All") return 1;
      const countA = categoryCounts[a.name] || 0;
      const countB = categoryCounts[b.name] || 0;
      return countB - countA;
    });
  }, [baseCategories, ideas]);

  // Filter ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesCategory =
        selectedCategory === "All" || idea.category === selectedCategory;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        idea.title?.toLowerCase().includes(query) ||
        idea.summary?.toLowerCase().includes(query) ||
        idea.content?.toLowerCase().includes(query) ||
        idea.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [ideas, selectedCategory, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ideas"] }),
      queryClient.invalidateQueries({ queryKey: ["localIdeas"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery("");
    setSelectedCategory("All");
    onClose();
  };

  const EmptyState = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: theme.spacing.xxl * 2,
        paddingHorizontal: theme.spacing.xxl,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.surface.level1,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: theme.spacing.xl,
        }}
      >
        <Lightbulb size={36} color={theme.colors.text.muted} strokeWidth={2} />
      </View>
      <AppText variant="title" color="primary" style={{ marginBottom: theme.spacing.sm }}>
        No thoughts found
      </AppText>
      <AppText variant="body" color="secondary" style={{ textAlign: "center" }}>
        {searchQuery
          ? `No thoughts match "${searchQuery}"`
          : "Start capturing thoughts with Voice or Text!"}
      </AppText>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.default,
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: theme.spacing.md,
            }}
          >
            <AppText
              style={{
                fontWeight: "600",
                color: theme.colors.text.secondary,
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: 14,
              }}
            >
              Thoughts
            </AppText>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.colors.surface.level1,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
              activeOpacity={0.7}
            >
              <X size={18} color={theme.colors.text.secondary} />
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
              onChangeText={setSearchQuery}
              placeholder=""
              placeholderTextColor={theme.colors.text.muted}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              style={{
                flex: 1,
                marginLeft: theme.spacing.md,
                ...theme.typography.body,
                color: theme.colors.text.primary,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                activeOpacity={0.7}
              >
                <X size={18} color={theme.colors.text.muted} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={{ paddingTop: theme.spacing.sm }}>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            scrollToSelected={visible && initialCategory !== "All"}
          />
        </View>

        {/* Ideas Grid */}
        <FlatList
          data={filteredIdeas}
          renderItem={({ item }) => <IdeaCard idea={item} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg - 2,
            paddingBottom: insets.bottom + 20,
          }}
          columnWrapperStyle={{
            justifyContent: "space-between",
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent.primary}
            />
          }
          ListEmptyComponent={!isLoading ? EmptyState : null}
        />
      </View>
    </Modal>
  );
}
