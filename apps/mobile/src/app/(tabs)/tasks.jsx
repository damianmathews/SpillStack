import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Circle,
  CheckCircle2,
  Trash2,
  ListTodo,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { Header } from "@/components/HomePage/Header";
import { FloatingActionButton } from "@/components/FAB/FloatingActionButton";
import { TaskVoiceModal } from "@/components/Modals/TaskVoiceModal";
import { TaskTextModal } from "@/components/Modals/TaskTextModal";
import { sampleTasks } from "@/data/sampleData";

const TASKS_STORAGE_KEY = "@spillstack_tasks";

export default function TasksPage() {
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
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        marginBottom: 10,
      }}
    >
      <TouchableOpacity
        onPress={() => toggleTask(task.id)}
        style={{ marginRight: 14 }}
      >
        {task.completed ? (
          <CheckCircle2
            size={24}
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
          />
        ) : (
          <Circle size={24} color={theme.colors.textTertiary} />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
            color: task.completed ? theme.colors.textTertiary : theme.colors.text,
            textDecorationLine: task.completed ? "line-through" : "none",
          }}
        >
          {task.title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.textTertiary,
            marginTop: 4,
          }}
        >
          {formatDate(task.created_at)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => deleteTask(task.id)}
        style={{ padding: 8 }}
      >
        <Trash2 size={18} color={theme.colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  const SectionHeader = ({ title, count }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 4,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: theme.colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 10,
          marginLeft: 8,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: theme.colors.textTertiary,
          }}
        >
          {count}
        </Text>
      </View>
    </View>
  );

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
        <ListTodo size={36} color={theme.colors.textTertiary} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: theme.colors.text,
          marginBottom: 8,
        }}
      >
        No tasks yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Tap the + button to add a task via voice or text. AI will help you capture it quickly.
      </Text>
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Header
        insets={insets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        title="Tasks"
      />

      <FlatList
        data={[{ key: "content" }]}
        renderItem={() => renderContent()}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
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
    </View>
  );
}
