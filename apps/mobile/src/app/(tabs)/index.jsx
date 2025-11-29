import React, { useState, useCallback, useEffect } from "react";
import { View, FlatList, RefreshControl, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react-native";

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
import { sampleIdeas, categories as defaultCategories } from "@/data/sampleData";

export default function IdeasPage() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme, isDark } = useTheme();

  // State
  const [selectedCategory, setSelectedCategory] = useState("All");
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
    const matchesSearch =
      !searchQuery ||
      idea.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.summary?.toLowerCase().includes(searchQuery.toLowerCase());
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
    // Two column layout
    return <IdeaCard idea={item} />;
  };

  const EmptyState = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Lightbulb size={36} color={theme.colors.textTertiary} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: theme.colors.text,
          marginBottom: 8,
        }}
      >
        No ideas yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Tap the + button to capture your first idea via voice, text, or link.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Header
        insets={insets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        title="SpillStack"
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
          paddingHorizontal: 14,
          paddingBottom: insets.bottom + 100,
        }}
        columnWrapperStyle={{
          justifyContent: "space-between",
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
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
    </View>
  );
}
