import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { X, Mic, Square, Check, RefreshCw, AlertTriangle, GitMerge } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useCreateIdea, getStoredIdeas } from "@/hooks/useCreateIdea";
import { checkDuplicate } from "@/services/ai";
import { sampleIdeas } from "@/data/sampleData";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

export function VoiceModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState("idle"); // idle, recording, processing, preview, duplicate
  const [ideaData, setIdeaData] = useState(null); // Full AI-processed data
  const [duplicateIdea, setDuplicateIdea] = useState(null); // If duplicate found

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(0.3))).current;

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    resetState();
  };

  const createIdeaMutation = useCreateIdea(handleSuccess);

  const handleTranscriptionComplete = async (data) => {
    // data includes: content, title, summary, category, tags, source_url
    setIdeaData(data);

    // Check for duplicates
    try {
      const localIdeas = await getStoredIdeas();
      const allIdeas = [...localIdeas, ...sampleIdeas];
      const { isDuplicate, similarTo } = await checkDuplicate(data.content, allIdeas);

      if (isDuplicate && similarTo) {
        const existing = allIdeas.find((i) => i.id === similarTo);
        if (existing) {
          setDuplicateIdea(existing);
          setStage("duplicate");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return;
        }
      }
    } catch (e) {
      console.warn("Duplicate check failed:", e);
    }

    setStage("preview");
  };

  const { isRecording, isTranscribing, recorderState, handleVoiceRecord } =
    useVoiceRecording(handleTranscriptionComplete);

  // Auto-start recording when modal opens
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (visible && !hasStartedRef.current && stage === "idle") {
      hasStartedRef.current = true;
      // Small delay to ensure modal is fully visible
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
    setIdeaData(null);
    setDuplicateIdea(null);
  };

  const handleViewExisting = () => {
    // Navigate to the existing duplicate idea
    onClose();
    resetState();
    router.push(`/idea/${duplicateIdea.id}`);
  };

  const handleSaveAnyway = () => {
    // Save the new idea despite being similar
    setDuplicateIdea(null);
    setStage("preview");
  };

  const handleClose = () => {
    if (isRecording) {
      handleVoiceRecord(); // Stop recording
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

  const handleSave = () => {
    if (!ideaData) return;
    createIdeaMutation.mutate({
      content: ideaData.content,
      title: ideaData.title,
      summary: ideaData.summary,
      category: ideaData.category,
      tags: ideaData.tags,
      source_type: "voice",
    });
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
              {stage === "idle" && "Voice Note"}
              {stage === "recording" && "Recording..."}
              {stage === "processing" && "Processing..."}
              {stage === "preview" && "Preview"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Idle / Recording State */}
            {(stage === "idle" || stage === "recording") && (
              <View style={styles.recordingContainer}>
                {/* Waveform Visualization */}
                <View style={styles.waveContainer}>
                  {waveAnims.map((anim, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveBar,
                        {
                          backgroundColor: theme.colors.primary,
                          transform: [{ scaleY: anim }],
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Timer */}
                <Text style={[styles.timer, { color: theme.colors.text }]}>
                  {formatTime(recorderState.currentTime || 0)}
                </Text>

                {/* Record Button */}
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
                          : theme.colors.primary,
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
              </View>
            )}

            {/* Processing State */}
            {stage === "processing" && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.processingText, { color: theme.colors.text }]}>
                  Transcribing your voice...
                </Text>
                <Text style={[styles.processingSubtext, { color: theme.colors.textSecondary }]}>
                  AI is processing your recording
                </Text>
              </View>
            )}

            {/* Preview State */}
            {stage === "preview" && ideaData && (
              <View style={styles.previewContainer}>
                {/* Title */}
                <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
                  {ideaData.title}
                </Text>

                {/* Category Badge */}
                <View style={[styles.categoryBadge, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
                    {ideaData.category}
                  </Text>
                </View>

                {/* Summary Card */}
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>
                    Summary
                  </Text>
                  <Text style={[styles.previewText, { color: theme.colors.text }]}>
                    {ideaData.summary}
                  </Text>
                </View>

                {/* Tags */}
                {ideaData.tags && ideaData.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {ideaData.tags.map((tag, index) => (
                      <View key={index} style={[styles.tag, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                          #{tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

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
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={handleSave}
                    disabled={createIdeaMutation.isPending}
                  >
                    {createIdeaMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Check size={20} color="#FFFFFF" />
                        <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                          Save Idea
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Duplicate Detection State */}
            {stage === "duplicate" && duplicateIdea && (
              <View style={styles.previewContainer}>
                {/* Warning Icon */}
                <View style={[styles.duplicateIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                  <AlertTriangle size={32} color={theme.colors.warning} />
                </View>

                <Text style={[styles.duplicateTitle, { color: theme.colors.text }]}>
                  Similar Idea Found
                </Text>
                <Text style={[styles.duplicateSubtext, { color: theme.colors.textSecondary }]}>
                  This looks like something you've already captured
                </Text>

                {/* Existing Idea Card */}
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.warning,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Text style={[styles.previewLabel, { color: theme.colors.warning }]}>
                    Existing Idea
                  </Text>
                  <Text style={[styles.existingTitle, { color: theme.colors.text }]}>
                    {duplicateIdea.title}
                  </Text>
                  <Text style={[styles.existingContent, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                    {duplicateIdea.summary || duplicateIdea.content}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.secondaryButton,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                    onPress={handleSaveAnyway}
                  >
                    <GitMerge size={20} color={theme.colors.text} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                      Save Anyway
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.primaryButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={handleViewExisting}
                  >
                    <Check size={20} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                      View Existing
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
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  categoryBadge: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 17,
    lineHeight: 26,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
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
  // Duplicate detection styles
  duplicateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  duplicateTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  duplicateSubtext: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  existingTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },
  existingContent: {
    fontSize: 15,
    lineHeight: 22,
  },
});
