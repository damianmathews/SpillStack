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
  Archive,
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
import { useTutorial, TUTORIAL_SAMPLE_IDEA, TUTORIAL_SAMPLE_TASK } from "@/contexts/TutorialContext";
import { useIdeas } from "@/hooks/useIdeas";
import { useCategories } from "@/hooks/useCategories";
import { getStoredIdeas } from "@/hooks/useCreateIdea";
import { UnifiedInputModal } from "@/components/Modals/UnifiedInputModal";
import { LinkModal } from "@/components/Modals/LinkModal";
import { AppScreen, AppText } from "@/components/primitives";
import { SpotlightTutorial } from "@/components/Tutorial/SpotlightTutorial";
import { categories as defaultCategories } from "@/data/sampleData";
import {
  getTasks as firestoreGetTasks,
  addTask as firestoreAddTask,
  updateTask as firestoreUpdateTask,
  deleteTask as firestoreDeleteTask,
} from "@/services/firestore";
import { HomeHeader } from "@/components/HomePage/HomeHeader";
import { QuickInputButtons } from "@/components/QuickInput/QuickInputButtons";
import { CategoryFilter } from "@/components/HomePage/CategoryFilter";
import { IdeasSheet } from "@/components/Sheets/IdeasSheet";
import { TasksSheet } from "@/components/Sheets/TasksSheet";
import { toast } from "sonner-native";

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
  const checkScale = useSharedValue(task.completed ? 1 : 0);
  const hasStartedRemoving = useRef(false);
  const removeTimerRef = useRef(null);
  const isTutorialSample = task.isTutorialSample;

  useEffect(() => {
    if (isRemoving && !hasStartedRemoving.current && !isTutorialSample) {
      hasStartedRemoving.current = true;
      checkScale.value = withSpring(1, { damping: 12, stiffness: 200 });

      removeTimerRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(onRemoveComplete)(task.id);
        });
        scale.value = withTiming(0.95, { duration: 250 });
      }, 2000);
    } else if (!isRemoving && hasStartedRemoving.current) {
      // Undo was clicked - reset everything
      if (removeTimerRef.current) {
        clearTimeout(removeTimerRef.current);
        removeTimerRef.current = null;
      }
      hasStartedRemoving.current = false;
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
      checkScale.value = withTiming(0, { duration: 150 });
    }
  }, [isRemoving, isTutorialSample]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (removeTimerRef.current) {
        clearTimeout(removeTimerRef.current);
      }
    };
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const isChecked = task.completed || isRemoving;

  return (
    <Animated.View style={[containerStyle, { marginBottom: 8, opacity: isTutorialSample ? 0.85 : 1 }]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.md,
          borderWidth: isTutorialSample ? 1.5 : 1,
          borderColor: isTutorialSample ? theme.colors.accent.primary + "40" : theme.colors.border.subtle,
          borderStyle: isTutorialSample ? "dashed" : "solid",
          paddingVertical: 12,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={() => !isTutorialSample && onToggle(task.id)}
          style={{ marginRight: theme.spacing.md }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isRemoving || isTutorialSample}
        >
          {isChecked ? (
            <Animated.View
              style={[
                {
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  backgroundColor: theme.colors.accent.primary,
                  alignItems: "center",
                  justifyContent: "center",
                },
                checkmarkStyle,
              ]}
            >
              <Check size={12} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
          ) : (
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: isTutorialSample ? theme.colors.accent.primary + "60" : theme.colors.text.muted,
              }}
            />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1, marginRight: theme.spacing.md }}>
          <AppText
            color={isChecked ? "muted" : "primary"}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              textDecorationLine: isChecked ? "line-through" : "none",
              opacity: isChecked ? 0.6 : 1,
              fontSize: 15,
              fontStyle: isTutorialSample ? "italic" : "normal",
            }}
          >
            {task.title}
          </AppText>
        </View>
        <AppText style={{ fontSize: 12, color: theme.colors.text.muted, flexShrink: 0, fontStyle: isTutorialSample ? "italic" : "normal" }}>
          {formatDate(task.created_at)}
        </AppText>
      </View>
    </Animated.View>
  );
});


export default function HomePage() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme, isDark } = useTheme();
  const { user } = useFirebaseAuth();
  const { registerTarget, showTutorial } = useTutorial();
  const { tag: tagParam, category: categoryParam, openIdeasSheet: openIdeasSheetParam } = useLocalSearchParams();

  // Tutorial target refs
  const quickInputRef = useRef(null);
  const ideaCardRef = useRef(null);
  const taskItemRef = useRef(null);
  const searchRef = useRef(null);

  // Register tutorial targets
  useEffect(() => {
    registerTarget("quick-input", quickInputRef);
    registerTarget("idea-card", ideaCardRef);
    registerTarget("task-item", taskItemRef);
    registerTarget("search", searchRef);
  }, [registerTarget]);

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

  // Set category from navigation params
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  // Open Ideas sheet with specific category from navigation params
  useEffect(() => {
    if (openIdeasSheetParam) {
      setIdeasSheetCategory(openIdeasSheetParam);
      setShowIdeasSheet(true);
    }
  }, [openIdeasSheetParam]);

  // Unified Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Sheet states
  const [showIdeasSheet, setShowIdeasSheet] = useState(false);
  const [showTasksSheet, setShowTasksSheet] = useState(false);
  const [ideasSheetCategory, setIdeasSheetCategory] = useState("All");

  // Track tasks being removed
  const [removingTasks, setRemovingTasks] = useState(new Set());

  // Fetch ideas
  const { data: apiIdeas = [] } = useIdeas("All", "");
  const { data: localIdeas = [] } = useQuery({
    queryKey: ["localIdeas"],
    queryFn: getStoredIdeas,
  });
  const { data: apiCategories = [] } = useCategories();

  // Fetch tasks from Firestore
  const { data: localTasks = [] } = useQuery({
    queryKey: ["localTasks"],
    queryFn: async () => {
      try {
        const tasks = await firestoreGetTasks();
        // Transform Firestore format to app format
        const transformedTasks = tasks.map((task) => ({
          ...task,
          created_at: task.createdAt?.toDate?.()?.toISOString() || task.created_at || new Date().toISOString(),
        }));
        // If no tasks in Firestore, return empty (no sample tasks for real users)
        return transformedTasks;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    },
  });

  // Use ideas from Firestore (localIdeas now comes from Firestore)
  // During tutorial, show sample content if user has no real content
  const hasRealIdeas = localIdeas.length > 0;
  const hasRealTasks = localTasks.length > 0;

  const ideas = React.useMemo(() => {
    if (showTutorial && !hasRealIdeas) {
      return [TUTORIAL_SAMPLE_IDEA];
    }
    return localIdeas;
  }, [showTutorial, hasRealIdeas, localIdeas]);

  const tasks = React.useMemo(() => {
    if (showTutorial && !hasRealTasks) {
      return [TUTORIAL_SAMPLE_TASK];
    }
    return localTasks;
  }, [showTutorial, hasRealTasks, localTasks]);

  const baseCategories = apiCategories.length > 0 ? apiCategories : defaultCategories;

  // Sort categories by idea count (most popular first)
  const categories = React.useMemo(() => {
    // Count ideas per category (exclude archived)
    const categoryCounts = {};
    ideas.forEach((idea) => {
      if (idea.archived) return; // Don't count archived ideas
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

  // Count archived ideas
  const archivedCount = React.useMemo(() => {
    return ideas.filter((idea) => idea.archived).length;
  }, [ideas]);

  // Filter ideas by search, tag, and category (exclude archived)
  const filteredIdeas = ideas.filter((idea) => {
    // Exclude archived ideas
    if (idea.archived) return false;
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
      // Update in Firestore
      await firestoreUpdateTask(taskId, { completed: true });
      queryClient.invalidateQueries({ queryKey: ["localTasks"] });

      // Show toast with undo option
      toast("Task completed", {
        action: {
          label: "Undo",
          onClick: () => {
            // Remove from removingTasks set first
            setRemovingTasks((prev) => {
              const next = new Set(prev);
              next.delete(taskId);
              return next;
            });
            // Then undo in Firestore
            firestoreUpdateTask(taskId, { completed: false }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["localTasks"] });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            });
          },
        },
        duration: 4000,
      });
    } else {
      // Toggle completion in Firestore
      await firestoreUpdateTask(taskId, { completed: !task?.completed });
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Section Header Component - simple text row, no container
  const SectionHeader = ({ title, onSeeAll, isFirst, count }) => {
    const content = (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.xs,
        }}
      >
        <AppText
          style={{
            fontWeight: "600",
            color: theme.colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: 13,
          }}
        >
          {title}
        </AppText>
        {onSeeAll && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <AppText
              style={{
                fontSize: 13,
                fontWeight: "400",
                color: theme.colors.accent.primary,
              }}
            >
              See all
            </AppText>
            {count !== undefined && (
              <AppText
                style={{
                  fontSize: 13,
                  fontWeight: "400",
                  color: theme.colors.accent.primary,
                }}
              >
                ({count})
              </AppText>
            )}
            <ChevronRight size={14} color={theme.colors.accent.primary} />
          </View>
        )}
      </View>
    );

    const wrapperStyle = {
      marginBottom: theme.spacing.xs,
      marginTop: isFirst ? theme.spacing.sm : theme.spacing.xxl,
      paddingHorizontal: theme.spacing.xl,
    };

    if (onSeeAll) {
      return (
        <TouchableOpacity
          onPress={onSeeAll}
          activeOpacity={0.6}
          style={wrapperStyle}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return <View style={wrapperStyle}>{content}</View>;
  };

  // Idea Card for horizontal scroll
  const RecentIdeaCard = ({ idea }) => {
    const previewText = idea.summary || idea.content || "";
    const categoryColor = categoryColors[idea.category] || theme.colors.accent.primary;
    const isTutorialSample = idea.isTutorialSample;

    return (
      <TouchableOpacity
        onPress={() => !isTutorialSample && handleIdeaPress(idea)}
        disabled={isTutorialSample}
        style={{
          width: 180,
          height: 160,
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.lg,
          borderWidth: isTutorialSample ? 1.5 : 1,
          borderColor: isTutorialSample ? theme.colors.accent.primary + "40" : theme.colors.border.subtle,
          borderStyle: isTutorialSample ? "dashed" : "solid",
          padding: theme.spacing.md,
          marginRight: theme.spacing.md,
          overflow: "hidden",
          opacity: isTutorialSample ? 0.85 : 1,
        }}
        activeOpacity={isTutorialSample ? 1 : 0.7}
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
              fontStyle: isTutorialSample ? "italic" : "normal",
            }}
          >
            {idea.category}
          </AppText>
        </View>
        <AppText
          variant="subtitle"
          color="primary"
          numberOfLines={2}
          style={{
            marginBottom: theme.spacing.xs,
            fontSize: 14,
            fontStyle: isTutorialSample ? "italic" : "normal",
          }}
        >
          {idea.title}
        </AppText>
        <View style={{ flex: 1, overflow: "hidden" }}>
          <AppText
            variant="caption"
            color="muted"
            numberOfLines={2}
            style={{
              fontSize: 11,
              lineHeight: 15,
              fontStyle: isTutorialSample ? "italic" : "normal",
            }}
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

      {/* Show archived link if there are archived ideas */}
      {archivedCount > 0 && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIdeasSheetCategory("Archived");
            setShowIdeasSheet(true);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            marginTop: theme.spacing.xl,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            backgroundColor: theme.colors.surface.level1,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <Archive size={16} color={theme.colors.text.secondary} />
          <AppText variant="body" color="secondary">
            View {archivedCount} archived {archivedCount === 1 ? "thought" : "thoughts"}
          </AppText>
        </TouchableOpacity>
      )}
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
        searchBarRef={searchRef}
      />

      {/* Quick Input Buttons - ONE TAP to Voice or Text (hide when searching) */}
      {!searchQuery && (
        <View ref={quickInputRef} collapsable={false}>
          <QuickInputButtons
            onVoice={() => setShowVoiceModal(true)}
            onText={() => setShowTextModal(true)}
          />
        </View>
      )}

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
              title="Thoughts"
              onSeeAll={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIdeasSheetCategory("All");
                setShowIdeasSheet(true);
              }}
              isFirst
              count={filteredIdeas.length}
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
                {recentIdeas.map((idea, index) => (
                  index === 0 ? (
                    <View key={idea.id} ref={ideaCardRef} collapsable={false}>
                      <RecentIdeaCard idea={idea} />
                    </View>
                  ) : (
                    <RecentIdeaCard key={idea.id} idea={idea} />
                  )
                ))}
              </ScrollView>
            ) : (
              <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
                <AppText variant="body" color="muted" style={{ textAlign: "center" }}>
                  {isSearching ? "No thoughts match your search" : "No thoughts yet"}
                </AppText>
              </View>
            )}

            {/* Tasks Section */}
            {!activeTag && (
              <>
                <SectionHeader
                  title="To Do"
                  onSeeAll={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowTasksSheet(true);
                  }}
                  count={filteredTasks.filter(t => !t.completed).length}
                />

                <View style={{ paddingHorizontal: theme.spacing.xl }}>
                  {pendingTasks.length > 0 ? (
                    pendingTasks.map((task, index) => (
                      index === 0 ? (
                        <View key={task.id} ref={taskItemRef} collapsable={false}>
                          <AnimatedTaskItem
                            task={task}
                            onToggle={toggleTask}
                            formatDate={formatDate}
                            isRemoving={removingTasks.has(task.id)}
                            onRemoveComplete={finishRemovingTask}
                            theme={theme}
                          />
                        </View>
                      ) : (
                        <AnimatedTaskItem
                          key={task.id}
                          task={task}
                          onToggle={toggleTask}
                          formatDate={formatDate}
                          isRemoving={removingTasks.has(task.id)}
                          onRemoveComplete={finishRemovingTask}
                          theme={theme}
                        />
                      )
                    ))
                  ) : (
                    <AppText variant="body" color="muted" style={{ textAlign: "center", paddingVertical: theme.spacing.md }}>
                      {isSearching ? "No tasks match your search" : "No pending tasks"}
                    </AppText>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Unified Input Modals - AI detects Idea vs Task */}
      <UnifiedInputModal visible={showVoiceModal} mode="voice" onClose={() => setShowVoiceModal(false)} />
      <UnifiedInputModal visible={showTextModal} mode="text" onClose={() => setShowTextModal(false)} />
      <LinkModal visible={showLinkModal} onClose={() => setShowLinkModal(false)} />

      {/* Full View Sheets */}
      <IdeasSheet visible={showIdeasSheet} onClose={() => setShowIdeasSheet(false)} initialCategory={ideasSheetCategory} />
      <TasksSheet visible={showTasksSheet} onClose={() => setShowTasksSheet(false)} />

      {/* Spotlight Tutorial - only shows on first launch */}
      <SpotlightTutorial />
    </AppScreen>
  );
}
