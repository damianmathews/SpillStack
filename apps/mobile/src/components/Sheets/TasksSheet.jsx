import React, { useState, useCallback } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Search, Circle, Check, Trash2, ListTodo } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/primitives";
import { sampleTasks } from "@/data/sampleData";

const TASKS_STORAGE_KEY = "@spillstack_tasks";

const saveTasks = async (newTasks) => {
  try {
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
};

export function TasksSheet({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tasks
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

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery("");
    onClose();
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
        marginHorizontal: theme.spacing.xl,
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
              width: 18,
              height: 18,
              borderRadius: 4,
              backgroundColor: theme.colors.accent.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : (
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: theme.colors.text.muted,
            }}
          />
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
        paddingHorizontal: theme.spacing.xl,
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
        No tasks found
      </AppText>
      <AppText variant="body" color="secondary" style={{ textAlign: "center" }}>
        {searchQuery
          ? `No tasks match "${searchQuery}"`
          : "Add tasks using Voice or Text!"}
      </AppText>
    </View>
  );

  const renderContent = () => {
    if (filteredTasks.length === 0) {
      return <EmptyState />;
    }

    return (
      <>
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
      </>
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
              To Do
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
              placeholder=""
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

        {/* Tasks List */}
        <FlatList
          data={[{ key: "content" }]}
          renderItem={() => renderContent()}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
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
        />
      </View>
    </Modal>
  );
}
