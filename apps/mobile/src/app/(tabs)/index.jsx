import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import {
  View,
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
  Plus,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

import { useTheme, categoryColors } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useIdeas } from "@/hooks/useIdeas";
import { useCategories } from "@/hooks/useCategories";
import { getStoredIdeas } from "@/hooks/useCreateIdea";
import { VoiceModal } from "@/components/Modals/VoiceModal";
import { TextModal } from "@/components/Modals/TextModal";
import { LinkModal } from "@/components/Modals/LinkModal";
import { TaskVoiceModal } from "@/components/Modals/TaskVoiceModal";
import { TaskTextModal } from "@/components/Modals/TaskTextModal";
import { AppScreen, AppText } from "@/components/primitives";
import { sampleIdeas, sampleTasks, categories as defaultCategories } from "@/data/sampleData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HomeHeader } from "@/components/HomePage/HomeHeader";
import { QuickInputButtons } from "@/components/QuickInput/QuickInputButtons";
import { CategoryFilter } from "@/components/HomePage/CategoryFilter";
import { IdeasSheet } from "@/components/Sheets/IdeasSheet";
import { TasksSheet } from "@/components/Sheets/TasksSheet";

const TASKS_STORAGE_KEY = "@spillstack_tasks";

// Animated Task Item Component
const AnimatedTaskItem = memo(function AnimatedTaskItem({
  task,
  onToggle,
  formatDate,
  isRemoving,
  onRemoveComplete,
  theme,
}) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const height = useSharedValue(60);
  const checkScale = useSharedValue(task.completed ? 1 : 0);
  const hasStartedRemoving = useRef(false);

  useEffect(() => {
    if (isRemoving && !hasStartedRemoving.current) {
      hasStartedRemoving.current = true;
      checkScale.value = withSpring(1, { damping: 12, stiffness: 200 });

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
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Set active tag from navigation params
  useEffect(() => {
    if (tagParam) {
      setActiveTag(tagParam);
    }
  }, [tagParam]);

  // Ideas Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Task Modal states
  const [showTaskVoiceModal, setShowTaskVoiceModal] = useState(false);
  const [showTaskTextModal, setShowTaskTextModal] = useState(false);

  // Sheet states
  const [showIdeasSheet, setShowIdeasSheet] = useState(false);
  const [showTasksSheet, setShowTasksSheet] = useState(false);

  // Track tasks being removed
  const [removingTasks, setRemovingTasks] = useState(new Set());

  // Fetch ideas
  const { data: apiIdeas = [] } = useIdeas("All", "");
  const { data: localIdeas = [] } = useQuery({
    queryKey: ["localIdeas"],
    queryFn: getStoredIdeas,
  });
  const { data: apiCategories = [] } = useCategories();

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
  const categories = apiCategories.length > 0 ? apiCategories : defaultCategories;

  // Filter ideas by search, tag, and category
  const filteredIdeas = ideas.filter((idea) => {
    // Filter by active tag
    if (activeTag && !idea.tags?.some((t) => t.toLowerCase() === activeTag.toLowerCase())) {
      return false;
    }
    // Filter by category
    if (selectedCategory !== "All" && idea.category !== selectedCategory) {
      return false;
    }
    // Filter by search query
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
    if (activeTag) return false;
    if (!searchQuery) return true;
    return task.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get recent ideas (show more now - up to 6)
  const recentIdeas = filteredIdeas.slice(0, 6);

  // Get pending tasks
  const pendingTasks = filteredTasks
    .filter((t) => !t.completed || removingTasks.has(t.id))
    .slice(0, 7);

  const toggleTask = async (taskId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const task = tasks.find((t) => t.id === taskId);

    if (task && !task.completed) {
      setRemovingTasks((prev) => new Set([...prev, taskId]));
      const newTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t
      );
      await saveTasks(newTasks);
      queryClient.invalidateQueries({ queryKey: ["localTasks"] });
    } else {
      const newTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      await saveTasks(newTasks);
      queryClient.invalidateQueries({ queryKey: ["localTasks"] });
    }
  };

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

  // Handle tasks created from modals
  const handleTasksCreated = async (newTasks) => {
    try {
      const stored = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      const currentTasks = stored ? JSON.parse(stored) : sampleTasks;
      const updatedTasks = [...newTasks, ...currentTasks];
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
      queryClient.invalidateQueries({ queryKey: ["localTasks"] });
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
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
        marginTop: isFirst ? theme.spacing.md : theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
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

  // Idea Card for horizontal scroll
  const RecentIdeaCard = ({ idea }) => {
    const previewText = idea.summary || idea.content || "";
    const categoryColor = categoryColors[idea.category] || theme.colors.accent.primary;

    return (
      <TouchableOpacity
        onPress={() => handleIdeaPress(idea)}
        style={{
          width: 180,
          height: 160,
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.md,
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
            paddingVertical: 3,
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
              fontSize: 10,
            }}
          >
            {idea.category}
          </AppText>
        </View>
        <AppText
          variant="subtitle"
          color="primary"
          numberOfLines={2}
          style={{ marginBottom: theme.spacing.xs, fontSize: 14 }}
        >
          {idea.title}
        </AppText>
        <View style={{ flex: 1, overflow: "hidden" }}>
          <AppText
            variant="caption"
            color="muted"
            numberOfLines={2}
            style={{ fontSize: 11, lineHeight: 15 }}
          >
            {previewText}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
          <Clock size={10} color={theme.colors.text.muted} />
          <AppText variant="caption" color="muted" style={{ fontSize: 10 }}>
            {formatDate(idea.created_at)}
          </AppText>
        </View>
      </TouchableOpacity>
    );
  };

  // Add Task Button
  const AddTaskButton = () => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowTaskTextModal(true);
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface.level1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        borderStyle: "dashed",
        marginTop: theme.spacing.sm,
      }}
      activeOpacity={0.7}
    >
      <Plus size={16} color={theme.colors.accent.primary} strokeWidth={2} />
      <AppText
        variant="body"
        style={{ color: theme.colors.accent.primary, marginLeft: theme.spacing.sm }}
      >
        Add task
      </AppText>
    </TouchableOpacity>
  );

  // Empty State
  const EmptyState = () => (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: theme.spacing.xxl * 2,
        paddingHorizontal: theme.spacing.xl,
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
        Welcome to SpillStack
      </AppText>
      <AppText variant="body" color="secondary" style={{ textAlign: "center" }}>
        Tap Voice or Text above to capture your first idea!
      </AppText>
    </View>
  );

  const isSearching = searchQuery.length > 0 || activeTag;
  const hasContent = recentIdeas.length > 0 || pendingTasks.length > 0;

  return (
    <AppScreen withGradient>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Compact Header */}
      <HomeHeader
        insets={insets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTag={activeTag}
        onClearTag={() => setActiveTag(null)}
      />

      {/* Quick Input Buttons - ONE TAP to Voice or Text */}
      <QuickInputButtons
        onVoice={() => setShowVoiceModal(true)}
        onText={() => setShowTextModal(true)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
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
        {!hasContent && !isSearching ? (
          <EmptyState />
        ) : (
          <>
            {/* Ideas Section */}
            <SectionHeader
              title="Ideas"
              icon={Sparkles}
              onSeeAll={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowIdeasSheet(true);
              }}
              isFirst
            />

            {/* Category Filter */}
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />

            {/* Ideas Horizontal Scroll */}
            {recentIdeas.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: theme.spacing.xl }}
              >
                {recentIdeas.map((idea) => (
                  <RecentIdeaCard key={idea.id} idea={idea} />
                ))}
              </ScrollView>
            ) : (
              <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
                <AppText variant="body" color="muted" style={{ textAlign: "center" }}>
                  {isSearching ? "No ideas match your search" : "No ideas yet"}
                </AppText>
              </View>
            )}

            {/* Tasks Section */}
            {!activeTag && (
              <>
                <SectionHeader
                  title="To Do"
                  icon={CheckCircle2}
                  onSeeAll={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowTasksSheet(true);
                  }}
                />

                <View style={{ paddingHorizontal: theme.spacing.xl }}>
                  {pendingTasks.length > 0 ? (
                    pendingTasks.map((task) => (
                      <AnimatedTaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        formatDate={formatDate}
                        isRemoving={removingTasks.has(task.id)}
                        onRemoveComplete={finishRemovingTask}
                        theme={theme}
                      />
                    ))
                  ) : (
                    <AppText variant="body" color="muted" style={{ textAlign: "center", paddingVertical: theme.spacing.md }}>
                      {isSearching ? "No tasks match your search" : "No pending tasks"}
                    </AppText>
                  )}

                  {/* Add Task Button */}
                  <AddTaskButton />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Ideas Modals */}
      <VoiceModal visible={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
      <TextModal visible={showTextModal} onClose={() => setShowTextModal(false)} />
      <LinkModal visible={showLinkModal} onClose={() => setShowLinkModal(false)} />

      {/* Task Modals */}
      <TaskVoiceModal
        visible={showTaskVoiceModal}
        onClose={() => setShowTaskVoiceModal(false)}
        onTasksCreated={handleTasksCreated}
      />
      <TaskTextModal
        visible={showTaskTextModal}
        onClose={() => setShowTaskTextModal(false)}
        onTasksCreated={handleTasksCreated}
      />

      {/* Full View Sheets */}
      <IdeasSheet visible={showIdeasSheet} onClose={() => setShowIdeasSheet(false)} />
      <TasksSheet visible={showTasksSheet} onClose={() => setShowTasksSheet(false)} />
    </AppScreen>
  );
}
