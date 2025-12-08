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
import { router } from "expo-router";
import {
  Circle,
  CheckCircle2,
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

export default function LibraryTasksPage() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [tasks, setTasks] = useState(sampleTasks);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);

  // Handle tasks created from modals
  const handleTasksCreated = (newTasks) => {
    const updatedTasks = [...newTasks, ...tasks];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Load tasks from storage
  const loadTasks = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (stored) {
        try {
          setTasks(JSON.parse(stored));
        } catch (parseError) {
          console.error("Error parsing tasks, clearing corrupted data:", parseError);
          await AsyncStorage.removeItem(TASKS_STORAGE_KEY);
          setTasks(sampleTasks);
        }
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  }, []);

  // Save tasks to storage
  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  const toggleTask = (taskId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    const newTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const deleteTask = (taskId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const newTasks = tasks.filter((task) => task.id !== taskId);
          setTasks(newTasks);
          saveTasks(newTasks);
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
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        paddingVertical: theme.spacing.sm + 2,
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
          <CheckCircle2
            size={20}
            color={theme.colors.accent.secondary}
            fill={theme.colors.accent.secondary}
          />
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
            opacity: task.completed ? 0.7 : 1,
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
        title="Tasks"
        showBackButton
        onBackPress={() => router.back()}
        backLabel="Library"
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
