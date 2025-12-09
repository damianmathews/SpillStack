import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { X, Sparkles, Check, ListTodo, RefreshCw } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { extractTasks } from "@/services/ai";
import * as Haptics from "expo-haptics";
import { BouncingDotsLoader } from "@/components/LoadingAnimations/BouncingDotsLoader";

export function TaskTextModal({ visible, onClose, onTasksCreated }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [stage, setStage] = useState("input"); // input, processing, preview
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  const handleTextChange = (value) => {
    setText(value);
  };

  const handleExtractTasks = async () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setStage("processing");
      const tasks = await extractTasks(text.trim());
      setExtractedTasks(tasks);
      setSelectedTasks(new Set(tasks.map((_, i) => i)));
      setStage("preview");
    } catch (error) {
      console.error("Task extraction failed:", error);
      // Fallback: use the text as a single task
      setExtractedTasks([text.trim()]);
      setSelectedTasks(new Set([0]));
      setStage("preview");
    }
  };

  const toggleTaskSelection = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const handleSave = () => {
    const tasksToCreate = extractedTasks
      .filter((_, index) => selectedTasks.has(index))
      .map((title) => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        completed: false,
        created_at: new Date().toISOString(),
      }));

    if (tasksToCreate.length > 0 && onTasksCreated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onTasksCreated(tasksToCreate);
    }
    onClose();
    setTimeout(resetState, 300);
  };

  const handleBack = () => {
    setStage("input");
    setExtractedTasks([]);
    setSelectedTasks(new Set());
  };

  const resetState = () => {
    setText("");
    setStage("input");
    setExtractedTasks([]);
    setSelectedTasks(new Set());
  };

  const handleClose = () => {
    // If we have extracted tasks (preview stage), show confirmation
    if (stage === "preview" && extractedTasks.length > 0) {
      Alert.alert(
        "Discard Tasks?",
        "Are you sure you want to exit without saving? Your tasks will be lost.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              onClose();
              setTimeout(resetState, 300);
            },
          },
        ]
      );
      return;
    }

    // If there's text entered in input stage, show confirmation
    if (text.trim()) {
      Alert.alert(
        "Discard Tasks?",
        "Are you sure you want to exit without saving? Your text will be lost.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              onClose();
              setTimeout(resetState, 300);
            },
          },
        ]
      );
      return;
    }

    onClose();
    setTimeout(resetState, 300);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <BlurView
        intensity={90}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleClose}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: theme.colors.surface.level1,
                    height: theme.componentHeight.iconButton,
                    width: theme.componentHeight.iconButton,
                    borderRadius: theme.componentHeight.iconButton / 2,
                  },
                ]}
              >
                <X size={20} color={theme.colors.text.primary} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[theme.typography.headline, { color: theme.colors.text.primary }]}>
                {stage === "input" && "New Task"}
                {stage === "processing" && "Extracting..."}
                {stage === "preview" && "Tasks Found"}
              </Text>
              {stage === "input" ? (
                <TouchableOpacity
                  onPress={handleExtractTasks}
                  disabled={!text.trim()}
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: text.trim()
                        ? theme.colors.secondary
                        : theme.colors.surface.level1,
                      height: theme.componentHeight.iconButton,
                      width: theme.componentHeight.iconButton,
                      borderRadius: theme.componentHeight.iconButton / 2,
                    },
                  ]}
                >
                  <Check
                    size={20}
                    color={text.trim() ? "#FFFFFF" : theme.colors.textTertiary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ) : (
                <View style={{ width: theme.componentHeight.iconButton }} />
              )}
            </View>

            {/* Input Stage */}
            {stage === "input" && (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.xl }]}
                keyboardDismissMode="interactive"
              >
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border.subtle,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.lg,
                    },
                  ]}
                >
                  <TextInput
                    value={text}
                    onChangeText={handleTextChange}
                    placeholder="What do you need to do?"
                    placeholderTextColor={theme.colors.text.muted}
                    style={[theme.typography.body, styles.textInput, { color: theme.colors.text.primary }]}
                    multiline
                    autoFocus
                    textAlignVertical="top"
                  />
                </View>

                <View style={[styles.footer, { marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.xs }]}>
                  <View style={styles.aiHint}>
                    <Sparkles size={14} color={theme.colors.secondary} strokeWidth={2} />
                    <Text style={[theme.typography.footnote, { color: theme.colors.textSecondary, marginLeft: theme.spacing.sm }]}>
                      AI will extract individual tasks
                    </Text>
                  </View>
                  <Text style={[theme.typography.footnote, { color: theme.colors.textTertiary }]}>
                    {text.length} characters
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Processing Stage */}
            {stage === "processing" && (
              <BouncingDotsLoader statusText="Finding your tasks..." />
            )}

            {/* Preview Stage */}
            {stage === "preview" && (
              <View style={[styles.previewContainer, { paddingHorizontal: theme.spacing.xl }]}>
                <View style={[styles.taskCountBadge, { gap: theme.spacing.sm, marginBottom: theme.spacing.sm }]}>
                  <ListTodo size={16} color={theme.colors.secondary} strokeWidth={2} />
                  <Text style={[theme.typography.bodyMedium, { color: theme.colors.secondary }]}>
                    {extractedTasks.length} task{extractedTasks.length > 1 ? "s" : ""} found
                  </Text>
                </View>

                <Text style={[theme.typography.footnote, { color: theme.colors.textSecondary, textAlign: "center", marginBottom: theme.spacing.lg }]}>
                  Tap to select/deselect tasks
                </Text>

                <ScrollView style={[styles.taskList, { marginBottom: theme.spacing.lg }]} showsVerticalScrollIndicator={false}>
                  {extractedTasks.map((task, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleTaskSelection(index)}
                      style={[
                        styles.taskItem,
                        {
                          backgroundColor: selectedTasks.has(index)
                            ? `${theme.colors.secondary}15`
                            : theme.colors.card,
                          borderColor: selectedTasks.has(index)
                            ? theme.colors.secondary
                            : theme.colors.border.subtle,
                          borderRadius: theme.borderRadius.md,
                          padding: theme.spacing.lg,
                          marginBottom: theme.spacing.md,
                          gap: theme.spacing.md,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: selectedTasks.has(index)
                              ? theme.colors.secondary
                              : "transparent",
                            borderColor: selectedTasks.has(index)
                              ? theme.colors.secondary
                              : theme.colors.textTertiary,
                            borderRadius: theme.borderRadius.xs + 2,
                          },
                        ]}
                      >
                        {selectedTasks.has(index) && (
                          <Check size={14} color="#FFFFFF" strokeWidth={2} />
                        )}
                      </View>
                      <Text style={[theme.typography.body, { color: theme.colors.text.primary, flex: 1 }]}>
                        {task}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={[styles.actionButtons, { gap: theme.spacing.md, paddingBottom: theme.spacing.xl }]}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.secondaryButton,
                      {
                        backgroundColor: theme.colors.surface.level1,
                        borderColor: theme.colors.border.subtle,
                        height: theme.componentHeight.button,
                        borderRadius: theme.borderRadius.md,
                        gap: theme.spacing.sm,
                      },
                    ]}
                    onPress={handleBack}
                  >
                    <RefreshCw size={20} color={theme.colors.text.primary} strokeWidth={2} />
                    <Text style={[theme.typography.bodyMedium, { color: theme.colors.text.primary }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.primaryButton,
                      {
                        backgroundColor: selectedTasks.size > 0
                          ? theme.colors.secondary
                          : theme.colors.surface.level1,
                        height: theme.componentHeight.button,
                        borderRadius: theme.borderRadius.md,
                        gap: theme.spacing.sm,
                      },
                    ]}
                    onPress={handleSave}
                    disabled={selectedTasks.size === 0}
                  >
                    <Check size={20} color={selectedTasks.size > 0 ? "#FFFFFF" : theme.colors.textTertiary} strokeWidth={2} />
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        { color: selectedTasks.size > 0 ? "#FFFFFF" : theme.colors.textTertiary },
                      ]}
                    >
                      Add {selectedTasks.size} Task{selectedTasks.size !== 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

// Static styles - theme values are applied inline
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, // theme.spacing.xl
    paddingVertical: 16, // theme.spacing.lg
  },
  closeButton: {
    width: 40, // theme.componentHeight.iconButton
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    width: 40, // theme.componentHeight.iconButton
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20, // theme.spacing.xl
    paddingBottom: 40,
  },
  inputContainer: {
    borderRadius: 16, // theme.borderRadius.lg
    borderWidth: 1,
    padding: 16, // theme.spacing.lg
    minHeight: 200,
  },
  textInput: {
    fontSize: 17,
    lineHeight: 26,
    minHeight: 168,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16, // theme.spacing.lg
    paddingHorizontal: 4, // theme.spacing.xs
  },
  aiHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6, // theme.spacing.sm
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: 20, // theme.spacing.xl
  },
  taskCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8, // theme.spacing.sm
    marginBottom: 8, // theme.spacing.sm
  },
  taskList: {
    flex: 1,
    marginBottom: 16, // theme.spacing.lg
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16, // theme.spacing.lg
    borderRadius: 12, // theme.borderRadius.md
    borderWidth: 1,
    marginBottom: 10, // theme.spacing.md
    gap: 12, // theme.spacing.md
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6, // theme.borderRadius.xs + 2
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12, // theme.spacing.md
    paddingBottom: 20, // theme.spacing.xl
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48, // theme.componentHeight.button
    borderRadius: 12, // theme.borderRadius.md
    gap: 8, // theme.spacing.sm
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {},
});
