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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { X, Sparkles, Check, ListTodo, RefreshCw } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { extractTasks } from "@/services/ai";
import * as Haptics from "expo-haptics";

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
    handleClose();
  };

  const handleBack = () => {
    setStage("input");
    setExtractedTasks([]);
    setSelectedTasks(new Set());
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setText("");
      setStage("input");
      setExtractedTasks([]);
      setSelectedTasks(new Set());
    }, 300);
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
                onPress={stage === "preview" ? handleBack : handleClose}
                style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
              >
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.colors.text }]}>
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
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Check
                    size={20}
                    color={text.trim() ? "#FFFFFF" : theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}
            </View>

            {/* Input Stage */}
            {stage === "input" && (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardDismissMode="interactive"
              >
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <TextInput
                    value={text}
                    onChangeText={handleTextChange}
                    placeholder="What do you need to do?"
                    placeholderTextColor={theme.colors.textTertiary}
                    style={[styles.textInput, { color: theme.colors.text }]}
                    multiline
                    autoFocus
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.footer}>
                  <View style={styles.aiHint}>
                    <Sparkles size={14} color={theme.colors.secondary} />
                    <Text style={[styles.aiHintText, { color: theme.colors.textSecondary }]}>
                      AI will extract individual tasks
                    </Text>
                  </View>
                  <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
                    {text.length} characters
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Processing Stage */}
            {stage === "processing" && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={theme.colors.secondary} />
                <Text style={[styles.processingText, { color: theme.colors.text }]}>
                  Extracting tasks...
                </Text>
                <Text style={[styles.processingSubtext, { color: theme.colors.textSecondary }]}>
                  AI is finding actionable items
                </Text>
              </View>
            )}

            {/* Preview Stage */}
            {stage === "preview" && (
              <View style={styles.previewContainer}>
                <View style={styles.taskCountBadge}>
                  <ListTodo size={16} color={theme.colors.secondary} />
                  <Text style={[styles.taskCountText, { color: theme.colors.secondary }]}>
                    {extractedTasks.length} task{extractedTasks.length > 1 ? "s" : ""} found
                  </Text>
                </View>

                <Text style={[styles.selectHint, { color: theme.colors.textSecondary }]}>
                  Tap to select/deselect tasks
                </Text>

                <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
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
                            : theme.colors.border,
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
                          },
                        ]}
                      >
                        {selectedTasks.has(index) && (
                          <Check size={14} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={[styles.taskText, { color: theme.colors.text }]}>
                        {task}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.secondaryButton,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                    onPress={handleBack}
                  >
                    <RefreshCw size={20} color={theme.colors.text} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
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
                          : theme.colors.surface,
                      },
                    ]}
                    onPress={handleSave}
                    disabled={selectedTasks.size === 0}
                  >
                    <Check size={20} color={selectedTasks.size > 0 ? "#FFFFFF" : theme.colors.textTertiary} />
                    <Text
                      style={[
                        styles.actionButtonText,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
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
    marginTop: 16,
    paddingHorizontal: 4,
  },
  aiHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aiHintText: {
    fontSize: 13,
  },
  charCount: {
    fontSize: 13,
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
  },
  processingSubtext: {
    fontSize: 15,
    marginTop: 8,
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  taskCountText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectHint: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  taskList: {
    flex: 1,
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {},
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
