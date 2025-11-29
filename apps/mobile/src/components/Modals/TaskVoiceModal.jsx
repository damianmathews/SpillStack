import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { X, Mic, Square, Check, RefreshCw, ListTodo } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { extractTasks, cleanupTranscription } from "@/services/ai";
import * as Haptics from "expo-haptics";

export function TaskVoiceModal({ visible, onClose, onTasksCreated }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState("idle"); // idle, recording, processing, preview
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(0.3))).current;

  const handleTranscriptionComplete = async (data) => {
    // Data contains cleaned content - now extract tasks from it
    try {
      const tasks = await extractTasks(data.content);
      setExtractedTasks(tasks);
      // Select all by default
      setSelectedTasks(new Set(tasks.map((_, i) => i)));
      setStage("preview");
    } catch (e) {
      console.error("Task extraction failed:", e);
      // Fallback: use the content as a single task
      setExtractedTasks([data.content]);
      setSelectedTasks(new Set([0]));
      setStage("preview");
    }
  };

  const { isRecording, isTranscribing, recorderState, handleVoiceRecord } =
    useVoiceRecording(handleTranscriptionComplete);

  // Auto-start recording when modal opens
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (visible && !hasStartedRef.current && stage === "idle") {
      hasStartedRef.current = true;
      const timer = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        handleVoiceRecord();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (!visible) {
      hasStartedRef.current = false;
    }
  }, [visible, stage]);

  // Update stage based on recording state
  useEffect(() => {
    if (isRecording) {
      setStage("recording");
    } else if (isTranscribing) {
      setStage("processing");
    }
  }, [isRecording, isTranscribing]);

  // Pulse animation for recording
  useEffect(() => {
    if (stage === "recording") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [stage]);

  // Wave animation
  useEffect(() => {
    if (stage === "recording") {
      waveAnims.forEach((anim, index) => {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 300 + index * 100,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 300 + index * 100,
              useNativeDriver: true,
            }),
          ])
        );
        animation.start();
      });
    } else {
      waveAnims.forEach((anim) => anim.setValue(0.3));
    }
  }, [stage]);

  const resetState = () => {
    setStage("idle");
    setExtractedTasks([]);
    setSelectedTasks(new Set());
  };

  const handleClose = () => {
    if (isRecording) {
      handleVoiceRecord();
    }
    onClose();
    setTimeout(resetState, 300);
  };

  const handleStartRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    handleVoiceRecord();
  };

  const handleStopRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleVoiceRecord();
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

  const handleRetry = () => {
    resetState();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <BlurView
        intensity={90}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
            >
              <X size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {stage === "idle" && "Voice Task"}
              {stage === "recording" && "Recording..."}
              {stage === "processing" && "Extracting tasks..."}
              {stage === "preview" && "Tasks Found"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Idle / Recording State */}
            {(stage === "idle" || stage === "recording") && (
              <View style={styles.recordingContainer}>
                <View style={styles.waveContainer}>
                  {waveAnims.map((anim, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveBar,
                        {
                          backgroundColor: theme.colors.secondary,
                          transform: [{ scaleY: anim }],
                        },
                      ]}
                    />
                  ))}
                </View>

                <Text style={[styles.timer, { color: theme.colors.text }]}>
                  {formatTime(recorderState.currentTime || 0)}
                </Text>

                <TouchableOpacity
                  onPress={stage === "idle" ? handleStartRecording : handleStopRecording}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.recordButton,
                      {
                        backgroundColor: stage === "recording"
                          ? theme.colors.error
                          : theme.colors.secondary,
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    {stage === "idle" ? (
                      <Mic size={32} color="#FFFFFF" />
                    ) : (
                      <Square size={28} color="#FFFFFF" fill="#FFFFFF" />
                    )}
                  </Animated.View>
                </TouchableOpacity>

                <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                  {stage === "idle" ? "Tap to start recording" : "Tap to stop"}
                </Text>
                <Text style={[styles.subHint, { color: theme.colors.textTertiary }]}>
                  AI will extract tasks from your voice
                </Text>
              </View>
            )}

            {/* Processing State */}
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

            {/* Preview State */}
            {stage === "preview" && extractedTasks.length > 0 && (
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

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.secondaryButton,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                    onPress={handleRetry}
                  >
                    <RefreshCw size={20} color={theme.colors.text} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                      Retry
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
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  recordingContainer: {
    alignItems: "center",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 80,
    marginBottom: 24,
    gap: 8,
  },
  waveBar: {
    width: 6,
    height: 60,
    borderRadius: 3,
  },
  timer: {
    fontSize: 48,
    fontWeight: "300",
    marginBottom: 40,
    fontVariant: ["tabular-nums"],
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  hint: {
    fontSize: 15,
  },
  subHint: {
    fontSize: 13,
    marginTop: 8,
  },
  processingContainer: {
    alignItems: "center",
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
    width: "100%",
    flex: 1,
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
