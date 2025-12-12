import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Keyboard,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Search, Lightbulb, Archive } from "lucide-react-native";
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
  const { width } = useWindowDimensions();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Responsive column count: 2 for phones, 3-5 for tablets
  const numColumns = useMemo(() => {
    if (width >= 1024) return 5; // Large tablet landscape
    if (width >= 768) return 4;  // iPad portrait / smaller tablet landscape
    if (width >= 600) return 3;  // Large phone landscape / small tablet
    return 2; // Phone portrait
  }, [width]);

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

  // Count archived ideas
  const archivedCount = useMemo(() => {
    return ideas.filter((idea) => idea.archived).length;
  }, [ideas]);

  // Sort categories by idea count (most popular first)
  const categories = useMemo(() => {
    // Count ideas per category (exclude archived)
    const categoryCounts = {};
    ideas.forEach((idea) => {
      if (idea.archived) return; // Don't count archived ideas
      const cat = idea.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Sort categories by count (descending), keeping "All" always first
    const sorted = [...baseCategories].sort((a, b) => {
      if (a.name === "All") return -1;
      if (b.name === "All") return 1;
      const countA = categoryCounts[a.name] || 0;
      const countB = categoryCounts[b.name] || 0;
      return countB - countA;
    });

    // Add "Archived" category at the end if there are archived ideas
    if (archivedCount > 0) {
      sorted.push({ name: "Archived", color: "#6B7280", icon: "archive" });
    }

    return sorted;
  }, [baseCategories, ideas, archivedCount]);

  // Filter ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      // Handle "Archived" category specially
      if (selectedCategory === "Archived") {
        if (!idea.archived) return false;
      } else {
        // Exclude archived ideas for all other categories
        if (idea.archived) return false;
      }

      const matchesCategory =
        selectedCategory === "All" ||
        selectedCategory === "Archived" ||
        idea.category === selectedCategory;
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

  const EmptyState = () => {
    const isArchiveView = selectedCategory === "Archived";
    const IconComponent = isArchiveView ? Archive : Lightbulb;

    return (
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
          <IconComponent size={36} color={theme.colors.text.muted} strokeWidth={2} />
        </View>
        <AppText variant="title" color="primary" style={{ marginBottom: theme.spacing.sm }}>
          {isArchiveView ? "No archived thoughts" : "No thoughts found"}
        </AppText>
        <AppText variant="body" color="secondary" style={{ textAlign: "center" }}>
          {searchQuery
            ? `No thoughts match "${searchQuery}"`
            : isArchiveView
            ? "Archived thoughts will appear here"
            : "Start capturing thoughts with Voice or Text!"}
        </AppText>
      </View>
    );
  };

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
              placeholder="Search your thoughts"
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
          key={`ideas-grid-${numColumns}`}
          data={filteredIdeas}
          renderItem={({ item }) => <IdeaCard idea={item} numColumns={numColumns} onNavigate={handleClose} />}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg - 2,
            paddingBottom: insets.bottom + 20,
          }}
          columnWrapperStyle={{
            justifyContent: "space-between",
            gap: theme.spacing.sm,
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
