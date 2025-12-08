import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  Circle,
  Check,
  Trash2,
  ListTodo,
  ArrowLeft,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { Header } from "@/components/HomePage/Header";
import { FloatingActionButton } from "@/components/FAB/FloatingActionButton";
import { TaskVoiceModal } from "@/components/Modals/TaskVoiceModal";
import { TaskTextModal } from "@/components/Modals/TaskTextModal";
import { AppScreen, AppText } from "@/components/primitives";
import { sampleTasks } from "@/data/sampleData";

const TASKS_STORAGE_KEY = "@spillstack_tasks";

// Save tasks to storage
const saveTasks = async (newTasks) => {
  try {
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
};

export default function LibraryTasksPage() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const cameFromHome = params.from === "home";

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);

  // Use React Query for tasks - same key as home page for sync
  const { data: tasks = [] } = useQuery({
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

  // Handle tasks created from modals
  const handleTasksCreated = async (newTasks) => {
    const updatedTasks = [...newTasks, ...tasks];
    await saveTasks(updatedTasks);
    queryClient.invalidateQueries({ queryKey: ["localTasks"] });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["localTasks"] });
    setRefreshing(false);
  }, [queryClient]);

  const toggleTask = async (taskId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await saveTasks(newTasks);
    queryClient.invalidateQueries({ queryKey: ["localTasks"] });
  };

  const deleteTask = (taskId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const newTasks = tasks.filter((task) => task.id !== taskId);
          await saveTasks(newTasks);
          queryClient.invalidateQueries({ queryKey: ["localTasks"] });
        },
      },
    ]);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Separate completed and pending
  const pendingTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const TaskItem = ({ task }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface.level1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
      }}
    >
      <TouchableOpacity
        onPress={() => toggleTask(task.id)}
        style={{ marginRight: theme.spacing.md }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {task.completed ? (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: theme.colors.accent.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : (
          <Circle size={20} color={theme.colors.text.muted} />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <AppText
          variant="body"
          color={task.completed ? "muted" : "primary"}
          numberOfLines={1}
          style={{
            textDecorationLine: task.completed ? "line-through" : "none",
            opacity: task.completed ? 0.6 : 1,
          }}
        >
          {task.title}
        </AppText>
      </View>

      <AppText variant="caption" color="muted" style={{ marginRight: theme.spacing.sm }}>
        {formatDate(task.created_at)}
      </AppText>

      <TouchableOpacity
        onPress={() => deleteTask(task.id)}
        style={{ padding: theme.spacing.xs }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={16} color={theme.colors.text.muted} />
      </TouchableOpacity>
    </View>
  );

  const SectionHeader = ({ title, count }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
      }}
    >
      <AppText
        variant="subtitle"
        color="muted"
        style={{
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </AppText>
      <View
        style={{
          backgroundColor: theme.colors.surface.level2,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          marginLeft: theme.spacing.sm,
        }}
      >
        <AppText variant="caption" color="muted">
          {count}
        </AppText>
      </View>
    </View>
  );

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
        <ListTodo size={36} color={theme.colors.text.muted} />
      </View>
      <AppText variant="title" color="primary" style={{ marginBottom: theme.spacing.sm }}>
        No tasks yet
      </AppText>
      <AppText variant="body" color="secondary" style={{ textAlign: "center" }}>
        Tap the + button to add a task via voice or text. AI will help you capture it quickly.
      </AppText>
    </View>
  );

  const renderContent = () => {
    if (filteredTasks.length === 0) {
      return <EmptyState />;
    }

    return (
      <View style={{ flex: 1 }}>
        {pendingTasks.length > 0 && (
          <>
            <SectionHeader title="To Do" count={pendingTasks.length} />
            {pendingTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </>
        )}

        {completedTasks.length > 0 && (
          <>
            <SectionHeader title="Completed" count={completedTasks.length} />
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </>
        )}
      </View>
    );
  };

  return (
    <AppScreen withGradient>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Header
        insets={insets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        title="To Do"
        showBackButton
        onBackPress={() => router.back()}
        backLabel={cameFromHome ? "Home" : "Library"}
      />

      <FlatList
        data={[{ key: "content" }]}
        renderItem={() => renderContent()}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
          />
        }
      />

      {/* Floating Action Button - no Link option for tasks */}
      <FloatingActionButton
        onVoice={() => setShowVoiceModal(true)}
        onText={() => setShowTextModal(true)}
        onLink={null}
      />

      {/* Task-specific Modals */}
      <TaskVoiceModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onTasksCreated={handleTasksCreated}
      />
      <TaskTextModal
        visible={showTextModal}
        onClose={() => setShowTextModal(false)}
        onTasksCreated={handleTasksCreated}
      />
    </AppScreen>
  );
}
