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
import { BouncingDotsLoader } from "@/components/LoadingAnimations/BouncingDotsLoader";

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
              {stage === "idle" && "Voice Task"}
              {stage === "recording" && "Recording..."}
              {stage === "processing" && "Extracting tasks..."}
              {stage === "preview" && "Tasks Found"}
            </Text>
            <View style={{ width: theme.componentHeight.iconButton }} />
          </View>

          {/* Content */}
          <View style={[styles.content, { paddingHorizontal: theme.spacing.xxl }]}>
            {/* Idle / Recording State */}
            {(stage === "idle" || stage === "recording") && (
              <View style={styles.recordingContainer}>
                <View style={[styles.waveContainer, { gap: theme.spacing.sm, marginBottom: theme.spacing.xxl }]}>
                  {waveAnims.map((anim, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveBar,
                        {
                          backgroundColor: theme.colors.secondary,
                          transform: [{ scaleY: anim }],
                          borderRadius: theme.borderRadius.xs,
                        },
                      ]}
                    />
                  ))}
                </View>

                <Text style={[styles.timer, { color: theme.colors.text.primary, marginBottom: theme.spacing.xxxl + 8 }]}>
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
                        marginBottom: theme.spacing.xxl,
                      },
                    ]}
                  >
                    {stage === "idle" ? (
                      <Mic size={32} color="#FFFFFF" strokeWidth={2} />
                    ) : (
                      <Square size={28} color="#FFFFFF" fill="#FFFFFF" />
                    )}
                  </Animated.View>
                </TouchableOpacity>

                <Text style={[theme.typography.subhead, { color: theme.colors.textSecondary }]}>
                  {stage === "idle" ? "Tap to start recording" : "Tap to stop"}
                </Text>
                <Text style={[theme.typography.footnote, { color: theme.colors.textTertiary, marginTop: theme.spacing.sm }]}>
                  AI will extract tasks from your voice
                </Text>
              </View>
            )}

            {/* Processing State */}
            {stage === "processing" && (
              <BouncingDotsLoader statusText="Finding your tasks..." />
            )}

            {/* Preview State */}
            {stage === "preview" && extractedTasks.length > 0 && (
              <View style={styles.previewContainer}>
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

                {/* Action Buttons */}
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
                    onPress={handleRetry}
                  >
                    <RefreshCw size={20} color={theme.colors.text.primary} strokeWidth={2} />
                    <Text style={[theme.typography.bodyMedium, { color: theme.colors.text.primary }]}>
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
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24, // theme.spacing.xxl
  },
  recordingContainer: {
    alignItems: "center",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 80,
    marginBottom: 24, // theme.spacing.xxl
    gap: 8, // theme.spacing.sm
  },
  waveBar: {
    width: 6,
    height: 60,
    borderRadius: 3, // theme.borderRadius.xs
  },
  timer: {
    fontSize: 48,
    fontWeight: "300",
    marginBottom: 40, // theme.spacing.xxxl + 8
    fontVariant: ["tabular-nums"],
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24, // theme.spacing.xxl
  },
  processingContainer: {
    alignItems: "center",
  },
  previewContainer: {
    width: "100%",
    flex: 1,
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
