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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { X, Mic, Square, Check, RefreshCw, AlertTriangle, GitMerge } from "lucide-react-native";
import { useTheme, categoryColors } from "@/contexts/ThemeContext";
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
    // If we have unsaved content (preview or duplicate stage), show confirmation
    if (stage === "preview" || stage === "duplicate") {
      Alert.alert(
        "Discard Recording?",
        "Are you sure you want to exit without saving? Your recording will be lost.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              if (isRecording) {
                handleVoiceRecord(); // Stop recording
              }
              onClose();
              setTimeout(resetState, 300);
            },
          },
        ]
      );
      return;
    }

    // If recording, just stop and close (no content to lose yet)
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

  const categoryColor = ideaData?.category
    ? categoryColors[ideaData.category] || theme.colors.accent.primary
    : theme.colors.accent.primary;

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
                styles.iconButton,
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
              {stage === "idle" && "Voice Note"}
              {stage === "recording" && "Recording..."}
              {stage === "processing" && "Processing..."}
              {stage === "preview" && "Preview"}
              {stage === "duplicate" && "Similar Found"}
            </Text>
            <View style={{ width: theme.componentHeight.iconButton }} />
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
                          backgroundColor: theme.colors.accent.primary,
                          borderRadius: theme.radius.sm,
                          transform: [{ scaleY: anim }],
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Timer */}
                <Text
                  style={[
                    styles.timer,
                    {
                      color: recorderState.showCountdown ? theme.colors.danger : theme.colors.text.primary,
                      fontVariant: ["tabular-nums"]
                    },
                  ]}
                >
                  {formatTime(recorderState.currentTime || 0)}
                </Text>

                {/* Countdown Warning */}
                {recorderState.showCountdown && (
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.danger,
                        marginBottom: theme.spacing.md,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {recorderState.timeRemaining}s remaining
                  </Text>
                )}

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
                          ? theme.colors.danger
                          : theme.colors.accent.primary,
                        transform: [{ scale: pulseAnim }],
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

                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.text.secondary, marginTop: theme.spacing.lg },
                  ]}
                >
                  {stage === "idle" ? "Tap to start recording" : "Tap to stop"}
                </Text>
              </View>
            )}

            {/* Processing State */}
            {stage === "processing" && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent.primary} />
                <Text
                  style={[
                    theme.typography.title,
                    { color: theme.colors.text.primary, marginTop: theme.spacing.xxl },
                  ]}
                >
                  Transcribing your voice...
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.text.secondary, marginTop: theme.spacing.sm },
                  ]}
                >
                  AI is processing your recording
                </Text>
              </View>
            )}

            {/* Preview State */}
            {stage === "preview" && ideaData && (
              <ScrollView
                style={styles.previewScrollView}
                contentContainerStyle={styles.previewContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Title */}
                <Text
                  style={[
                    theme.typography.title,
                    { color: theme.colors.text.primary, textAlign: "center", marginBottom: theme.spacing.md },
                  ]}
                >
                  {ideaData.title}
                </Text>

                {/* Category Badge */}
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: `${categoryColor}20`,
                      borderRadius: theme.radius.pill,
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.sm,
                      marginBottom: theme.spacing.xl,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      { color: categoryColor },
                    ]}
                  >
                    {ideaData.category}
                  </Text>
                </View>

                {/* Summary Card */}
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: theme.colors.surface.level1,
                      borderColor: theme.colors.border.subtle,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing.xl,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.text.muted, marginBottom: theme.spacing.md, textTransform: "uppercase", letterSpacing: 0.5 },
                    ]}
                  >
                    SUMMARY
                  </Text>
                  <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
                    {ideaData.summary}
                  </Text>
                </View>

                {/* Tags */}
                {ideaData.tags && ideaData.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {ideaData.tags.map((tag, index) => (
                      <View
                        key={index}
                        style={[
                          styles.tag,
                          {
                            backgroundColor: theme.colors.surface.level2,
                            borderColor: theme.colors.border.subtle,
                            borderWidth: 1,
                            borderRadius: theme.radius.pill,
                            paddingHorizontal: theme.spacing.md,
                            paddingVertical: theme.spacing.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            theme.typography.caption,
                            { color: theme.colors.text.secondary },
                          ]}
                        >
                          #{tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={[styles.actionButtons, { gap: theme.spacing.md }]}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: theme.colors.surface.level1,
                        borderColor: theme.colors.border.subtle,
                        borderWidth: 1,
                        borderRadius: theme.radius.md,
                        height: theme.componentHeight.button,
                      },
                    ]}
                    onPress={handleRetry}
                  >
                    <RefreshCw size={18} color={theme.colors.text.primary} strokeWidth={2} />
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        { color: theme.colors.text.primary, marginLeft: theme.spacing.sm },
                      ]}
                    >
                      Retry
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: theme.colors.accent.primary,
                        borderRadius: theme.radius.md,
                        height: theme.componentHeight.button,
                      },
                    ]}
                    onPress={handleSave}
                    disabled={createIdeaMutation.isPending}
                  >
                    {createIdeaMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Check size={18} color="#FFFFFF" strokeWidth={2} />
                        <Text
                          style={[
                            theme.typography.bodyMedium,
                            { color: "#FFFFFF", marginLeft: theme.spacing.sm },
                          ]}
                        >
                          Save Idea
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* Duplicate Detection State */}
            {stage === "duplicate" && duplicateIdea && (
              <View style={styles.previewContainer}>
                {/* Warning Icon */}
                <View
                  style={[
                    styles.duplicateIcon,
                    {
                      backgroundColor: `${theme.colors.warning}20`,
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  <AlertTriangle size={32} color={theme.colors.warning} strokeWidth={2} />
                </View>

                <Text
                  style={[
                    theme.typography.title,
                    { color: theme.colors.text.primary, textAlign: "center", marginBottom: theme.spacing.sm },
                  ]}
                >
                  Similar Idea Found
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.text.secondary, textAlign: "center", marginBottom: theme.spacing.xxl },
                  ]}
                >
                  This looks like something you've already captured
                </Text>

                {/* Existing Idea Card */}
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: theme.colors.surface.level1,
                      borderColor: theme.colors.warning,
                      borderWidth: 2,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing.xl,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.warning, marginBottom: theme.spacing.md, textTransform: "uppercase", letterSpacing: 0.5 },
                    ]}
                  >
                    EXISTING IDEA
                  </Text>
                  <Text
                    style={[
                      theme.typography.headline,
                      { color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
                    ]}
                  >
                    {duplicateIdea.title}
                  </Text>
                  <Text
                    style={[theme.typography.body, { color: theme.colors.text.secondary }]}
                    numberOfLines={3}
                  >
                    {duplicateIdea.summary || duplicateIdea.content}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={[styles.actionButtons, { gap: theme.spacing.md }]}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: theme.colors.surface.level1,
                        borderColor: theme.colors.border.subtle,
                        borderWidth: 1,
                        borderRadius: theme.radius.md,
                        height: theme.componentHeight.button,
                      },
                    ]}
                    onPress={handleSaveAnyway}
                  >
                    <GitMerge size={18} color={theme.colors.text.primary} strokeWidth={2} />
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        { color: theme.colors.text.primary, marginLeft: theme.spacing.sm },
                      ]}
                    >
                      Save Anyway
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: theme.colors.accent.primary,
                        borderRadius: theme.radius.md,
                        height: theme.componentHeight.button,
                      },
                    ]}
                    onPress={handleViewExisting}
                  >
                    <Check size={18} color="#FFFFFF" strokeWidth={2} />
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        { color: "#FFFFFF", marginLeft: theme.spacing.sm },
                      ]}
                    >
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
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
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
  },
  timer: {
    fontSize: 48,
    fontWeight: "300",
    marginBottom: 40,
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  processingContainer: {
    alignItems: "center",
  },
  previewScrollView: {
    flex: 1,
    width: "100%",
  },
  previewContainer: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 40,
  },
  categoryBadge: {
    alignSelf: "center",
  },
  previewCard: {
    width: "100%",
    borderWidth: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  tag: {},
  actionButtons: {
    flexDirection: "row",
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  duplicateIcon: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
