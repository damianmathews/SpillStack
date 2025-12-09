import React, { useState, useEffect, useRef } from "react";
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
  ActionSheetIOS,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  X,
  Sparkles,
  Check,
  RefreshCw,
  AlertTriangle,
  GitMerge,
  ArrowRight,
  Mic,
  Square,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
} from "lucide-react-native";
import { useTheme, categoryColors } from "@/contexts/ThemeContext";
import { useCreateIdea, getStoredIdeas } from "@/hooks/useCreateIdea";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { processUnifiedInput, reprocessAs, checkDuplicate } from "@/services/ai";
import { sampleIdeas, sampleTasks, categories as defaultCategories } from "@/data/sampleData";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { BouncingDotsLoader } from "@/components/LoadingAnimations/BouncingDotsLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";

const TASKS_STORAGE_KEY = "@spillstack_tasks";

export function UnifiedInputModal({ visible, mode = "text", onClose }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Input state
  const [text, setText] = useState("");
  const [charCount, setCharCount] = useState(0);

  // Processing state
  const [stage, setStage] = useState(mode === "voice" ? "idle" : "input");
  // idle (voice), recording, input (text), processing, preview, duplicate

  // Result state
  const [processedResult, setProcessedResult] = useState(null);
  // { type: 'idea'|'task', data: {...}, rawContent: string }

  const [selectedType, setSelectedType] = useState(null); // User override
  const [selectedCategory, setSelectedCategory] = useState(null); // User override for ideas
  const [duplicateIdea, setDuplicateIdea] = useState(null);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Voice recording state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(0.3))).current;

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    resetState();
  };

  const createIdeaMutation = useCreateIdea(handleSuccess);

  // Voice recording handlers
  const handleTranscriptionComplete = async (data) => {
    // data includes: content from voice
    setText(data.content || "");
    processContent(data.content || "");
  };

  const { isRecording, isTranscribing, recorderState, handleVoiceRecord } =
    useVoiceRecording(handleTranscriptionComplete);

  // Auto-start voice recording when modal opens in voice mode
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (visible && mode === "voice" && !hasStartedRef.current && stage === "idle") {
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
  }, [visible, mode, stage]);

  // Update stage based on recording state
  useEffect(() => {
    if (mode === "voice") {
      if (isRecording) {
        setStage("recording");
      } else if (isTranscribing) {
        setStage("processing");
      }
    }
  }, [isRecording, isTranscribing, mode]);

  // Voice animations
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
    setText("");
    setCharCount(0);
    setStage(mode === "voice" ? "idle" : "input");
    setProcessedResult(null);
    setSelectedType(null);
    setSelectedCategory(null);
    setDuplicateIdea(null);
    setIsReprocessing(false);
  };

  const handleTextChange = (value) => {
    setText(value);
    setCharCount(value.length);
  };

  const processContent = async (content) => {
    if (!content.trim()) return;

    try {
      setStage("processing");

      // Process with unified AI (classifies and processes)
      const result = await processUnifiedInput(content.trim());
      setProcessedResult(result);
      setSelectedType(result.type);

      if (result.type === "idea") {
        setSelectedCategory(result.data.category);

        // Check for duplicates (ideas only)
        try {
          const localIdeas = await getStoredIdeas();
          const allIdeas = [...localIdeas, ...sampleIdeas];
          const { isDuplicate, similarTo } = await checkDuplicate(content, allIdeas);

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
      }

      setStage("preview");
    } catch (error) {
      console.error("AI processing failed:", error);
      // Fallback
      setProcessedResult({
        type: "idea",
        data: {
          title: content.trim().substring(0, 50),
          summary: content.trim().substring(0, 100),
          category: "Personal",
          tags: [],
          content: content.trim(),
        },
        rawContent: content.trim(),
      });
      setSelectedType("idea");
      setSelectedCategory("Personal");
      setStage("preview");
    }
  };

  const handleProcess = async () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    processContent(text.trim());
  };

  const handleTypeSwitch = async (newType) => {
    if (newType === selectedType || !processedResult) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsReprocessing(true);

    try {
      const result = await reprocessAs(processedResult.rawContent, newType);
      setProcessedResult(result);
      setSelectedType(newType);

      if (newType === "idea") {
        setSelectedCategory(result.data.category);
      }
    } catch (e) {
      console.error("Reprocess failed:", e);
    }

    setIsReprocessing(false);
  };

  const showTypePicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Save as Idea", "Save as Task"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleTypeSwitch("idea");
          if (buttonIndex === 2) handleTypeSwitch("task");
        }
      );
    } else {
      // Android - simple toggle
      handleTypeSwitch(selectedType === "idea" ? "task" : "idea");
    }
  };

  const showCategoryPicker = () => {
    const categories = defaultCategories.filter((c) => c.name !== "All").map((c) => c.name);

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", ...categories],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            setSelectedCategory(categories[buttonIndex - 1]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      );
    } else {
      // Android - cycle through categories
      const currentIndex = categories.indexOf(selectedCategory);
      const nextIndex = (currentIndex + 1) % categories.length;
      setSelectedCategory(categories[nextIndex]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleViewExisting = () => {
    onClose();
    resetState();
    router.push(`/idea/${duplicateIdea.id}`);
  };

  const handleSaveAnyway = () => {
    setDuplicateIdea(null);
    setStage("preview");
  };

  const handleBack = () => {
    if (mode === "voice") {
      resetState();
    } else {
      setStage("input");
    }
  };

  const handleClose = () => {
    if (stage === "preview" || stage === "duplicate") {
      Alert.alert(
        "Discard?",
        "Are you sure you want to exit without saving?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              if (isRecording) handleVoiceRecord();
              onClose();
              setTimeout(resetState, 300);
            },
          },
        ]
      );
      return;
    }

    if (text.trim() && stage === "input") {
      Alert.alert(
        "Discard?",
        "Are you sure you want to exit without saving?",
        [
          { text: "Cancel", style: "cancel" },
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

    if (isRecording) handleVoiceRecord();
    onClose();
    setTimeout(resetState, 300);
  };

  const handleSave = async () => {
    if (!processedResult) return;

    const finalType = selectedType || processedResult.type;

    if (finalType === "task") {
      // Save tasks
      const tasks = processedResult.data.tasks || [processedResult.rawContent];
      const newTasks = tasks.map((title, index) => ({
        id: `task-${Date.now()}-${index}`,
        title,
        completed: false,
        created_at: new Date().toISOString(),
      }));

      try {
        const stored = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        const currentTasks = stored ? JSON.parse(stored) : sampleTasks;
        const updatedTasks = [...newTasks, ...currentTasks];
        await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
        queryClient.invalidateQueries({ queryKey: ["localTasks"] });
        handleSuccess();
      } catch (error) {
        console.error("Error saving tasks:", error);
      }
    } else {
      // Save idea
      createIdeaMutation.mutate({
        content: processedResult.rawContent,
        title: processedResult.data.title,
        summary: processedResult.data.summary,
        category: selectedCategory || processedResult.data.category,
        tags: processedResult.data.tags,
        source_type: mode,
      });
    }
  };

  const handleStartRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    handleVoiceRecord();
  };

  const handleStopRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleVoiceRecord();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const categoryColor =
    selectedCategory && categoryColors[selectedCategory]
      ? categoryColors[selectedCategory]
      : theme.colors.accent.primary;

  const currentType = selectedType || processedResult?.type || "idea";

  return (
    <Modal visible={visible} animationType={mode === "voice" ? "fade" : "slide"} transparent statusBarTranslucent>
      <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={stage === "preview" || stage === "duplicate" ? handleBack : handleClose}
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
                {stage === "input" && "New Entry"}
                {stage === "processing" && "Processing..."}
                {stage === "preview" && "Preview"}
                {stage === "duplicate" && "Similar Found"}
              </Text>
              {stage === "input" ? (
                <TouchableOpacity
                  onPress={handleProcess}
                  disabled={!text.trim()}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: text.trim() ? theme.colors.accent.primary : theme.colors.surface.level1,
                      height: theme.componentHeight.iconButton,
                      width: theme.componentHeight.iconButton,
                      borderRadius: theme.componentHeight.iconButton / 2,
                    },
                  ]}
                >
                  <ArrowRight size={20} color={text.trim() ? "#FFFFFF" : theme.colors.text.muted} strokeWidth={2} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: theme.componentHeight.iconButton }} />
              )}
            </View>

            {/* Voice: Idle / Recording State */}
            {mode === "voice" && (stage === "idle" || stage === "recording") && (
              <View style={styles.recordingContainer}>
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

                <Text
                  style={[
                    styles.timer,
                    {
                      color: recorderState.showCountdown ? theme.colors.danger : theme.colors.text.primary,
                      fontVariant: ["tabular-nums"],
                    },
                  ]}
                >
                  {formatTime(recorderState.currentTime || 0)}
                </Text>

                {recorderState.showCountdown && (
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.danger, marginBottom: theme.spacing.md, fontWeight: "600" },
                    ]}
                  >
                    {recorderState.timeRemaining}s remaining
                  </Text>
                )}

                <TouchableOpacity
                  onPress={stage === "idle" ? handleStartRecording : handleStopRecording}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.recordButton,
                      {
                        backgroundColor: stage === "recording" ? theme.colors.danger : theme.colors.accent.primary,
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

                <Text style={[theme.typography.body, { color: theme.colors.text.secondary, marginTop: theme.spacing.lg }]}>
                  {stage === "idle" ? "Tap to start recording" : "Tap to stop"}
                </Text>
              </View>
            )}

            {/* Text: Input Stage */}
            {mode === "text" && stage === "input" && (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.xl }]}
                keyboardDismissMode="interactive"
              >
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.colors.surface.level1,
                      borderColor: theme.colors.border.subtle,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing.lg,
                    },
                  ]}
                >
                  <TextInput
                    value={text}
                    onChangeText={handleTextChange}
                    placeholder="What's on your mind?"
                    placeholderTextColor={theme.colors.text.muted}
                    style={[theme.typography.body, styles.textInput, { color: theme.colors.text.primary }]}
                    multiline
                    autoFocus
                    textAlignVertical="top"
                  />
                </View>

                <View style={[styles.footer, { marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.xs }]}>
                  <View style={styles.aiHint}>
                    <Sparkles size={14} color={theme.colors.accent.primary} strokeWidth={2} />
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginLeft: theme.spacing.sm }]}>
                      AI will detect idea or task
                    </Text>
                  </View>
                  <Text style={[theme.typography.caption, { color: theme.colors.text.muted }]}>{charCount} characters</Text>
                </View>
              </ScrollView>
            )}

            {/* Processing Stage */}
            {stage === "processing" && (
              <View style={styles.processingContainer}>
                <BouncingDotsLoader statusText="AI is thinking..." />
              </View>
            )}

            {/* Preview Stage */}
            {stage === "preview" && processedResult && (
              <ScrollView
                style={styles.previewScrollView}
                contentContainerStyle={[styles.previewContainer, { paddingHorizontal: theme.spacing.xl }]}
                showsVerticalScrollIndicator={false}
              >
                {/* Type Selector */}
                <TouchableOpacity
                  onPress={showTypePicker}
                  disabled={isReprocessing}
                  style={[
                    styles.typeSelector,
                    {
                      backgroundColor: currentType === "idea" ? `${theme.colors.accent.primary}20` : `${theme.colors.success}20`,
                      borderRadius: theme.radius.pill,
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.sm,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  {isReprocessing ? (
                    <ActivityIndicator size="small" color={currentType === "idea" ? theme.colors.accent.primary : theme.colors.success} />
                  ) : (
                    <>
                      {currentType === "idea" ? (
                        <Lightbulb size={16} color={theme.colors.accent.primary} strokeWidth={2} />
                      ) : (
                        <CheckCircle2 size={16} color={theme.colors.success} strokeWidth={2} />
                      )}
                      <Text
                        style={[
                          theme.typography.bodyMedium,
                          {
                            color: currentType === "idea" ? theme.colors.accent.primary : theme.colors.success,
                            marginLeft: theme.spacing.sm,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          },
                        ]}
                      >
                        {currentType === "idea" ? "Idea" : "Task"}
                      </Text>
                      <ChevronDown
                        size={16}
                        color={currentType === "idea" ? theme.colors.accent.primary : theme.colors.success}
                        style={{ marginLeft: 4 }}
                      />
                    </>
                  )}
                </TouchableOpacity>

                {/* Title (for ideas) or Task list (for tasks) */}
                {currentType === "idea" ? (
                  <>
                    <Text
                      style={[
                        theme.typography.title,
                        { color: theme.colors.text.primary, textAlign: "center", marginBottom: theme.spacing.md },
                      ]}
                    >
                      {processedResult.data.title}
                    </Text>

                    {/* Category Badge - tappable */}
                    <TouchableOpacity
                      onPress={showCategoryPicker}
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
                      <Text style={[theme.typography.bodyMedium, { color: categoryColor }]}>{selectedCategory}</Text>
                      <ChevronDown size={14} color={categoryColor} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

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
                          {
                            color: theme.colors.text.muted,
                            marginBottom: theme.spacing.md,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          },
                        ]}
                      >
                        SUMMARY
                      </Text>
                      <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
                        {processedResult.data.summary}
                      </Text>
                    </View>

                    {/* Tags */}
                    {processedResult.data.tags && processedResult.data.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {processedResult.data.tags.map((tag, index) => (
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
                            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {/* Task Preview */}
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.text.muted,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          marginBottom: theme.spacing.md,
                          alignSelf: "flex-start",
                        },
                      ]}
                    >
                      {processedResult.data.tasks?.length === 1 ? "TASK" : `${processedResult.data.tasks?.length || 1} TASKS`}
                    </Text>

                    {(processedResult.data.tasks || [processedResult.rawContent]).map((task, index) => (
                      <View
                        key={index}
                        style={[
                          styles.taskPreviewItem,
                          {
                            backgroundColor: theme.colors.surface.level1,
                            borderColor: theme.colors.border.subtle,
                            borderRadius: theme.radius.lg,
                            padding: theme.spacing.lg,
                            marginBottom: theme.spacing.sm,
                          },
                        ]}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: theme.colors.text.muted,
                            marginRight: theme.spacing.md,
                          }}
                        />
                        <Text style={[theme.typography.body, { color: theme.colors.text.primary, flex: 1 }]}>{task}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Action Buttons */}
                <View style={[styles.actionButtons, { gap: theme.spacing.md, marginTop: theme.spacing.lg }]}>
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
                    onPress={handleBack}
                  >
                    <RefreshCw size={18} color={theme.colors.text.primary} strokeWidth={2} />
                    <Text style={[theme.typography.bodyMedium, { color: theme.colors.text.primary, marginLeft: theme.spacing.sm }]}>
                      {mode === "voice" ? "Retry" : "Edit"}
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
                        <Text style={[theme.typography.bodyMedium, { color: "#FFFFFF", marginLeft: theme.spacing.sm }]}>
                          Save {currentType === "idea" ? "Idea" : currentType === "task" && (processedResult.data.tasks?.length || 1) > 1 ? "Tasks" : "Task"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* Duplicate Detection State */}
            {stage === "duplicate" && duplicateIdea && (
              <View style={[styles.duplicateContainer, { paddingHorizontal: theme.spacing.xl }]}>
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
                      {
                        color: theme.colors.warning,
                        marginBottom: theme.spacing.md,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      },
                    ]}
                  >
                    EXISTING IDEA
                  </Text>
                  <Text style={[theme.typography.headline, { color: theme.colors.text.primary, marginBottom: theme.spacing.sm }]}>
                    {duplicateIdea.title}
                  </Text>
                  <Text style={[theme.typography.body, { color: theme.colors.text.secondary }]} numberOfLines={3}>
                    {duplicateIdea.summary || duplicateIdea.content}
                  </Text>
                </View>

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
                    <Text style={[theme.typography.bodyMedium, { color: theme.colors.text.primary, marginLeft: theme.spacing.sm }]}>
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
                    <Text style={[theme.typography.bodyMedium, { color: "#FFFFFF", marginLeft: theme.spacing.sm }]}>View Existing</Text>
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
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  recordingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  inputContainer: {
    borderWidth: 1,
    minHeight: 200,
  },
  textInput: {
    minHeight: 168,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiHint: {
    flexDirection: "row",
    alignItems: "center",
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
  typeSelector: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
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
  taskPreviewItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
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
  duplicateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  duplicateIcon: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
