import React, { useState, useCallback } from "react";
import { View, FlatList, RefreshControl, Keyboard, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Lightbulb, ArrowLeft } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { useIdeas } from "@/hooks/useIdeas";
import { useCategories } from "@/hooks/useCategories";
import { getStoredIdeas } from "@/hooks/useCreateIdea";
import { Header } from "@/components/HomePage/Header";
import { CategoryFilter } from "@/components/HomePage/CategoryFilter";
import { IdeaCard } from "@/components/HomePage/IdeaCard";
import { FloatingActionButton } from "@/components/FAB/FloatingActionButton";
import { VoiceModal } from "@/components/Modals/VoiceModal";
import { TextModal } from "@/components/Modals/TextModal";
import { LinkModal } from "@/components/Modals/LinkModal";
import { AppScreen, AppText } from "@/components/primitives";
import { sampleIdeas, categories as defaultCategories } from "@/data/sampleData";

export default function LibraryIdeasPage() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams();
  const cameFromHome = params.from === "home";

  // Get initial category from URL params if passed
  const initialCategory = params.category || "All";

  // State
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Fetch ideas and categories
  const { data: apiIdeas = [], isLoading } = useIdeas(selectedCategory, searchQuery);
  const { data: apiCategories = [] } = useCategories();

  // Fetch locally stored ideas
  const { data: localIdeas = [] } = useQuery({
    queryKey: ["localIdeas"],
    queryFn: getStoredIdeas,
  });

  // Combine local ideas + sample ideas (local first, then samples)
  const allIdeas = [...localIdeas, ...sampleIdeas];

  // Use API data if available, otherwise use combined local + sample
  const ideas = apiIdeas.length > 0 ? apiIdeas : allIdeas;
  const categories = apiCategories.length > 0 ? apiCategories : defaultCategories;

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    const matchesCategory =
      selectedCategory === "All" || idea.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      idea.title?.toLowerCase().includes(query) ||
      idea.summary?.toLowerCase().includes(query) ||
      idea.content?.toLowerCase().includes(query) ||
      idea.tags?.some(tag => tag.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ideas"] }),
      queryClient.invalidateQueries({ queryKey: ["localIdeas"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const renderIdea = ({ item, index }) => {
    return <IdeaCard idea={item} />;
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
        No ideas yet
      </AppText>
      <AppText variant="body" color="secondary" style={{ textAlign: "center" }}>
        Tap the + button to capture your first idea via voice, text, or link.
      </AppText>
    </View>
  );

  // Custom header with back button
  const LibraryHeader = () => (
    <View
      style={{
        paddingTop: insets.top + theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {/* Back button row */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: theme.spacing.md,
        }}
        activeOpacity={0.7}
      >
        <ArrowLeft size={20} color={theme.colors.accent.primary} />
        <AppText
          variant="body"
          style={{ color: theme.colors.accent.primary, marginLeft: theme.spacing.xs }}
        >
          Library
        </AppText>
      </TouchableOpacity>

      {/* Title */}
      <AppText
        variant="display"
        color="primary"
        style={{ marginBottom: theme.spacing.lg }}
      >
        Ideas
      </AppText>

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
        <Lightbulb size={18} color={theme.colors.text.muted} strokeWidth={2} />
        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <AppText
            variant="body"
            color="muted"
            style={{
              ...theme.typography.body,
            }}
            onPress={() => {}}
          >
            {searchQuery || "Search ideas..."}
          </AppText>
        </View>
      </View>
    </View>
  );

  return (
    <AppScreen withGradient>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Header
        insets={insets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        title="All Ideas"
        showBackButton
        onBackPress={() => router.back()}
        backLabel={cameFromHome ? "Home" : "Library"}
      />

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <FlatList
        data={filteredIdeas}
        renderItem={renderIdea}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg - 2,
          paddingBottom: insets.bottom + 100,
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

      {/* Floating Action Button */}
      <FloatingActionButton
        onVoice={() => setShowVoiceModal(true)}
        onText={() => setShowTextModal(true)}
        onLink={() => setShowLinkModal(true)}
      />

      {/* Modals */}
      <VoiceModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
      <TextModal
        visible={showTextModal}
        onClose={() => setShowTextModal(false)}
      />
      <LinkModal
        visible={showLinkModal}
        onClose={() => setShowLinkModal(false)}
      />
    </AppScreen>
  );
}
