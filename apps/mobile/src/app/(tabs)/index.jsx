import React, { useState, useCallback, useEffect, useRef, memo } from "react";
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
  Clock,
  Sparkles,
  ChevronRight,
  Check,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
  FadeOut,
  SlideOutLeft,
  Layout,
} from "react-native-reanimated";

import { useTheme, categoryColors } from "@/contexts/ThemeContext";
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

// Animated Task Item Component - defined outside main component to prevent remounting
const AnimatedTaskItem = memo(function AnimatedTaskItem({
  task,
  onToggle,
  onNavigate,
  formatDate,
  isRemoving,
  onRemoveComplete,
  theme
}) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const height = useSharedValue(60);
  const checkScale = useSharedValue(task.completed ? 1 : 0);
  const hasStartedRemoving = useRef(false);

  useEffect(() => {
    if (isRemoving && !hasStartedRemoving.current) {
      hasStartedRemoving.current = true;
      // Animate checkmark in with spring
      checkScale.value = withSpring(1, { damping: 12, stiffness: 200 });

      // After 2 seconds, fade out and collapse
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 250 });
        scale.value = withTiming(0.95, { duration: 250 });
        height.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(onRemoveComplete)(task.id);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isRemoving]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    height: height.value,
    marginBottom: height.value > 0 ? 8 : 0,
    overflow: "hidden",
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const isChecked = task.completed || isRemoving;

  return (
    <Animated.View style={containerStyle}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.md,
          height: 52,
        }}
      >
        <TouchableOpacity
          onPress={() => onToggle(task.id)}
          style={{ marginRight: theme.spacing.sm }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isRemoving}
        >
          {isChecked ? (
            <Animated.View
              style={[
                {
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme.colors.accent.primary,
                  alignItems: "center",
                  justifyContent: "center",
                },
                checkmarkStyle,
              ]}
            >
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
          ) : (
            <Circle size={20} color={theme.colors.text.muted} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNavigate}
          style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
          activeOpacity={0.7}
          disabled={isRemoving}
        >
          <View style={{ flex: 1, marginRight: theme.spacing.md }}>
            <AppText
              variant="caption"
              color={isChecked ? "muted" : "primary"}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                textDecorationLine: isChecked ? "line-through" : "none",
                opacity: isChecked ? 0.6 : 1,
                fontSize: 14,
              }}
            >
              {task.title}
            </AppText>
          </View>
          <AppText variant="caption" color="muted" style={{ fontSize: 12, flexShrink: 0 }}>
            {formatDate(task.created_at)}
          </AppText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

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
  const { tag: tagParam } = useLocalSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTag, setActiveTag] = useState(null);

  // Set active tag from navigation params
  useEffect(() => {
    if (tagParam) {
      setActiveTag(tagParam);
    }
  }, [tagParam]);

  // Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Track tasks being removed (showing checked state before animating out)
  const [removingTasks, setRemovingTasks] = useState(new Set());

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

  // Filter by search query and active tag (global search across all content)
  const filteredIdeas = ideas.filter((idea) => {
    // First filter by active tag if present
    if (activeTag && !idea.tags?.some((t) => t.toLowerCase() === activeTag.toLowerCase())) {
      return false;
    }
    // Then filter by search query if present
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
    // Hide tasks when filtering by tag (tasks don't have tags)
    if (activeTag) return false;
    // Only show tasks that match search query
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

  // Get tasks - show incomplete tasks plus any that are currently animating out
  const pendingTasks = filteredTasks
    .filter((t) => !t.completed || removingTasks.has(t.id))
    .slice(0, 10);

  const toggleTask = async (taskId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const task = tasks.find((t) => t.id === taskId);

    if (task && !task.completed) {
      // Task is being completed - add to removing set to show checked state
      setRemovingTasks((prev) => new Set([...prev, taskId]));

      // Save the task as completed immediately
      const newTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t
      );
      await saveTasks(newTasks);
      queryClient.invalidateQueries({ queryKey: ["localTasks"] });
    } else {
      // Task is being uncompleted - just toggle normally
      const newTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      await saveTasks(newTasks);
      queryClient.invalidateQueries({ queryKey: ["localTasks"] });
    }
  };

  // Remove task from removing set (called after animation completes)
  const finishRemovingTask = useCallback((taskId) => {
    setRemovingTasks((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

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
  const SectionHeader = ({ title, icon: Icon, onSeeAll, isFirst }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: theme.spacing.sm,
        marginTop: isFirst ? theme.spacing.lg : theme.spacing.xl,
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

  // Recent Idea Card (horizontal scroll) - taller with content preview
  const RecentIdeaCard = ({ idea }) => {
    // Get preview text from summary or content
    const previewText = idea.summary || idea.content || "";
    // Get category color
    const categoryColor = categoryColors[idea.category] || theme.colors.accent.primary;

    return (
      <TouchableOpacity
        onPress={() => handleIdeaPress(idea)}
        style={{
          width: 200,
          height: 180,
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.lg,
          marginRight: theme.spacing.md,
          overflow: "hidden",
        }}
        activeOpacity={0.7}
      >
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: `${categoryColor}15`,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            borderRadius: theme.radius.sm,
            marginBottom: theme.spacing.sm,
          }}
        >
          <AppText
            variant="caption"
            style={{
              color: categoryColor,
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
          style={{ marginBottom: theme.spacing.xs }}
        >
          {idea.title}
        </AppText>
        {/* Content preview with fade effect */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          <AppText
            variant="caption"
            color="muted"
            numberOfLines={3}
            style={{ fontSize: 12, lineHeight: 16 }}
          >
            {previewText}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
          <Clock size={12} color={theme.colors.text.muted} />
          <AppText variant="caption" color="muted">
            {formatDate(idea.created_at)}
          </AppText>
        </View>
      </TouchableOpacity>
    );
  };


  // Empty State for search
  const SearchEmptyState = () => (
    <View
      style={{
        alignItems: "center",
        paddingVertical: theme.spacing.xxl * 2,
      }}
    >
      <AppText variant="body" color="secondary" style={{ textAlign: "center" }}>
        {activeTag && searchQuery
          ? `No results found for "${searchQuery}" with tag #${activeTag}`
          : activeTag
          ? `No ideas found with tag #${activeTag}`
          : `No results found for "${searchQuery}"`}
      </AppText>
    </View>
  );

  const isSearching = searchQuery.length > 0 || activeTag;
  const hasSearchResults = filteredIdeas.length > 0 || filteredTasks.length > 0;

  return (
    <AppScreen withGradient>
      <StatusBar style={isDark ? "light" : "dark"} />

      <HomeHeader
        insets={insets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTag={activeTag}
        onClearTag={() => setActiveTag(null)}
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
                  title="Ideas"
                  icon={Sparkles}
                  onSeeAll={() => router.push("/(tabs)/library/ideas?from=home")}
                  isFirst
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
                  title="To Do"
                  icon={CheckCircle2}
                  onSeeAll={() => router.push("/(tabs)/library/tasks?from=home")}
                  isFirst={recentIdeas.length === 0}
                />
                {pendingTasks.map((task) => (
                  <AnimatedTaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onNavigate={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/(tabs)/library/tasks");
                    }}
                    formatDate={formatDate}
                    isRemoving={removingTasks.has(task.id)}
                    onRemoveComplete={finishRemovingTask}
                    theme={theme}
                  />
                ))}
              </>
            )}

            {/* All Recent Content (if searching) */}
            {isSearching && filteredIdeas.length > 0 && (
              <>
                <SectionHeader title="Ideas" icon={Lightbulb} isFirst />
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
                          backgroundColor: `${categoryColors[idea.category] || theme.colors.accent.primary}15`,
                          paddingHorizontal: theme.spacing.sm,
                          paddingVertical: theme.spacing.xs,
                          borderRadius: theme.radius.sm,
                          marginLeft: theme.spacing.sm,
                        }}
                      >
                        <AppText variant="caption" style={{ color: categoryColors[idea.category] || theme.colors.accent.primary }}>
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
