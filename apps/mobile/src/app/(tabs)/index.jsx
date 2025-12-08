import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  Keyboard,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Lightbulb,
  CheckCircle2,
  Circle,
  Settings,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useIdeas } from "@/hooks/useIdeas";
import { getStoredIdeas } from "@/hooks/useCreateIdea";
import { FloatingActionButton } from "@/components/FAB/FloatingActionButton";
import { VoiceModal } from "@/components/Modals/VoiceModal";
import { TextModal } from "@/components/Modals/TextModal";
import { LinkModal } from "@/components/Modals/LinkModal";
import { AppScreen, AppText } from "@/components/primitives";
import { sampleIdeas, sampleTasks } from "@/data/sampleData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HomeHeader } from "@/components/HomePage/HomeHeader";

const TASKS_STORAGE_KEY = "@spillstack_tasks";

// Save tasks to storage
const saveTasks = async (newTasks) => {
  try {
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
};

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme, isDark } = useTheme();
  const { user } = useFirebaseAuth();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Fetch ideas
  const { data: apiIdeas = [] } = useIdeas("All", "");
  const { data: localIdeas = [] } = useQuery({
    queryKey: ["localIdeas"],
    queryFn: getStoredIdeas,
  });

  // Fetch tasks
  const { data: localTasks = [] } = useQuery({
    queryKey: ["localTasks"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : sampleTasks;
      } catch {
        return sampleTasks;
      }
    },
  });

  // Combine ideas
  const allIdeas = [...localIdeas, ...sampleIdeas];
  const ideas = apiIdeas.length > 0 ? apiIdeas : allIdeas;
  const tasks = localTasks;

  // Filter by search query (global search across all content)
  const filteredIdeas = ideas.filter((idea) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      idea.title?.toLowerCase().includes(query) ||
      idea.summary?.toLowerCase().includes(query) ||
      idea.content?.toLowerCase().includes(query) ||
      idea.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    return task.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get recent items (last 7 days)
  const recentIdeas = filteredIdeas
    .filter((idea) => {
      const created = new Date(idea.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created >= weekAgo;
    })
    .slice(0, 4);

  // Get upcoming/pending tasks - show more since there's space
  const pendingTasks = filteredTasks.filter((t) => !t.completed).slice(0, 5);

  const toggleTask = async (taskId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await saveTasks(newTasks);
    queryClient.invalidateQueries({ queryKey: ["localTasks"] });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ideas"] }),
      queryClient.invalidateQueries({ queryKey: ["localIdeas"] }),
      queryClient.invalidateQueries({ queryKey: ["localTasks"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const handleIdeaPress = (idea) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/idea/${idea.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Section Header Component
  const SectionHeader = ({ title, icon: Icon, onSeeAll }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.xl,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <Icon size={18} color={theme.colors.accent.primary} />
        <AppText variant="subtitle" color="primary" style={{ fontWeight: "600" }}>
          {title}
        </AppText>
      </View>
      {onSeeAll && (
        <TouchableOpacity
          onPress={onSeeAll}
          style={{ flexDirection: "row", alignItems: "center" }}
          activeOpacity={0.7}
        >
          <AppText variant="caption" color="secondary">
            See all
          </AppText>
          <ChevronRight size={14} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Recent Idea Card (horizontal scroll)
  const RecentIdeaCard = ({ idea }) => (
    <TouchableOpacity
      onPress={() => handleIdeaPress(idea)}
      style={{
        width: 200,
        backgroundColor: theme.colors.surface.level1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: theme.spacing.lg,
        marginRight: theme.spacing.md,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: theme.colors.accent.softBg,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          marginBottom: theme.spacing.sm,
        }}
      >
        <AppText
          variant="caption"
          style={{
            color: theme.colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: "500",
          }}
        >
          {idea.category}
        </AppText>
      </View>
      <AppText
        variant="subtitle"
        color="primary"
        numberOfLines={2}
        style={{ marginBottom: theme.spacing.sm }}
      >
        {idea.title}
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
        <Clock size={12} color={theme.colors.text.muted} />
        <AppText variant="caption" color="muted">
          {formatDate(idea.created_at)}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  // Task Preview Item
  const TaskPreviewItem = ({ task }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface.level1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
      }}
    >
      <TouchableOpacity
        onPress={() => toggleTask(task.id)}
        style={{ marginRight: theme.spacing.md }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {task.completed ? (
          <CheckCircle2
            size={22}
            color={theme.colors.accent.secondary}
            fill={theme.colors.accent.secondary}
          />
        ) : (
          <Circle size={22} color={theme.colors.text.muted} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/(tabs)/library/tasks");
        }}
        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <AppText
            variant="body"
            color={task.completed ? "muted" : "primary"}
            numberOfLines={1}
            style={{
              textDecorationLine: task.completed ? "line-through" : "none",
              opacity: task.completed ? 0.7 : 1,
            }}
          >
            {task.title}
          </AppText>
        </View>
        <AppText variant="caption" color="muted">
          {formatDate(task.created_at)}
        </AppText>
      </TouchableOpacity>
    </View>
  );

  // Empty State for search
  const SearchEmptyState = () => (
    <View
      style={{
        alignItems: "center",
        paddingVertical: theme.spacing.xxl * 2,
      }}
    >
      <AppText variant="body" color="secondary" style={{ textAlign: "center" }}>
        No results found for "{searchQuery}"
      </AppText>
    </View>
  );

  const isSearching = searchQuery.length > 0;
  const hasSearchResults = filteredIdeas.length > 0 || filteredTasks.length > 0;

  return (
    <AppScreen withGradient>
      <StatusBar style={isDark ? "light" : "dark"} />

      <HomeHeader
        insets={insets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSettingsPress={() => router.push("/settings-modal")}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: insets.bottom + 100,
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
      >
        {isSearching && !hasSearchResults ? (
          <SearchEmptyState />
        ) : (
          <>
            {/* Recent Ideas Section */}
            {recentIdeas.length > 0 && (
              <>
                <SectionHeader
                  title="New this week"
                  icon={Sparkles}
                  onSeeAll={() => router.push("/(tabs)/library")}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -theme.spacing.xl }}
                  contentContainerStyle={{ paddingHorizontal: theme.spacing.xl }}
                >
                  {recentIdeas.map((idea) => (
                    <RecentIdeaCard key={idea.id} idea={idea} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Upcoming Tasks Section */}
            {pendingTasks.length > 0 && (
              <>
                <SectionHeader
                  title="Upcoming tasks"
                  icon={CheckCircle2}
                  onSeeAll={() => router.push("/(tabs)/library/tasks")}
                />
                {pendingTasks.map((task) => (
                  <TaskPreviewItem key={task.id} task={task} />
                ))}
              </>
            )}

            {/* All Recent Content (if searching) */}
            {isSearching && filteredIdeas.length > 0 && (
              <>
                <SectionHeader title="Ideas" icon={Lightbulb} />
                {filteredIdeas.slice(0, 6).map((idea) => (
                  <TouchableOpacity
                    key={idea.id}
                    onPress={() => handleIdeaPress(idea)}
                    style={{
                      backgroundColor: theme.colors.surface.level1,
                      borderRadius: theme.radius.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.border.subtle,
                      padding: theme.spacing.lg,
                      marginBottom: theme.spacing.sm,
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <View style={{ flex: 1 }}>
                        <AppText variant="subtitle" color="primary" numberOfLines={1}>
                          {idea.title}
                        </AppText>
                        {idea.summary && (
                          <AppText
                            variant="caption"
                            color="secondary"
                            numberOfLines={2}
                            style={{ marginTop: theme.spacing.xs }}
                          >
                            {idea.summary}
                          </AppText>
                        )}
                      </View>
                      <View
                        style={{
                          backgroundColor: theme.colors.accent.softBg,
                          paddingHorizontal: theme.spacing.sm,
                          paddingVertical: theme.spacing.xs,
                          borderRadius: theme.radius.sm,
                          marginLeft: theme.spacing.sm,
                        }}
                      >
                        <AppText variant="caption" style={{ color: theme.colors.text.secondary }}>
                          {idea.category}
                        </AppText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Empty state when no content at all */}
            {!isSearching && recentIdeas.length === 0 && pendingTasks.length === 0 && (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: theme.spacing.xxl * 2,
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
                <AppText
                  variant="title"
                  color="primary"
                  style={{ marginBottom: theme.spacing.sm }}
                >
                  Welcome to SpillStack
                </AppText>
                <AppText
                  variant="body"
                  color="secondary"
                  style={{ textAlign: "center", paddingHorizontal: theme.spacing.xl }}
                >
                  Tap the + button to capture your first idea via voice, text, or link.
                </AppText>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onVoice={() => setShowVoiceModal(true)}
        onText={() => setShowTextModal(true)}
        onLink={() => setShowLinkModal(true)}
      />

      {/* Modals */}
      <VoiceModal visible={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
      <TextModal visible={showTextModal} onClose={() => setShowTextModal(false)} />
      <LinkModal visible={showLinkModal} onClose={() => setShowLinkModal(false)} />
    </AppScreen>
  );
}
