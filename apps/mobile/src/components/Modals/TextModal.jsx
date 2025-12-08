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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { X, Sparkles, Check, RefreshCw, AlertTriangle, GitMerge, ArrowRight } from "lucide-react-native";
import { useTheme, categoryColors } from "@/contexts/ThemeContext";
import { useCreateIdea, getStoredIdeas } from "@/hooks/useCreateIdea";
import { processIdea, checkDuplicate } from "@/services/ai";
import { sampleIdeas } from "@/data/sampleData";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { BouncingDotsLoader } from "@/components/LoadingAnimations/BouncingDotsLoader";
import { AppText } from "@/components/primitives";

export function TextModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [stage, setStage] = useState("input"); // input, processing, preview, duplicate
  const [ideaData, setIdeaData] = useState(null); // Full AI-processed data
  const [duplicateIdea, setDuplicateIdea] = useState(null); // If duplicate found

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    resetState();
  };

  const createIdeaMutation = useCreateIdea(handleSuccess);

  const handleTextChange = (value) => {
    setText(value);
    setCharCount(value.length);
  };

  const handleProcess = async () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setStage("processing");

      // Process with AI to get title, summary, category, tags
      const aiProcessed = await processIdea(text.trim());

      const data = {
        content: text.trim(),
        title: aiProcessed.title,
        summary: aiProcessed.summary,
        category: aiProcessed.category,
        tags: aiProcessed.tags,
        source_type: "text",
      };

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
    } catch (error) {
      console.error("AI processing failed:", error);
      // Fallback: create basic idea data
      setIdeaData({
        content: text.trim(),
        title: text.trim().substring(0, 50) + (text.trim().length > 50 ? "..." : ""),
        summary: text.trim().substring(0, 100),
        category: "Uncategorized",
        tags: [],
        source_type: "text",
      });
      setStage("preview");
    }
  };

  const resetState = () => {
    setText("");
    setCharCount(0);
    setStage("input");
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

  const handleBack = () => {
    // Go back to input stage to edit
    setStage("input");
  };

  const handleClose = () => {
    // If we have unsaved content (preview or duplicate stage), show confirmation
    if (stage === "preview" || stage === "duplicate") {
      Alert.alert(
        "Discard Idea?",
        "Are you sure you want to exit without saving? Your idea will be lost.",
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
        "Discard Idea?",
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

  const handleSave = () => {
    if (!ideaData) return;
    createIdeaMutation.mutate({
      content: ideaData.content,
      title: ideaData.title,
      summary: ideaData.summary,
      category: ideaData.category,
      tags: ideaData.tags,
      source_type: "text",
    });
  };

  const categoryColor = ideaData?.category
    ? categoryColors[ideaData.category] || theme.colors.accent.primary
    : theme.colors.accent.primary;

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
                {stage === "input" && "New Idea"}
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
                      backgroundColor: text.trim()
                        ? theme.colors.accent.primary
                        : theme.colors.surface.level1,
                      height: theme.componentHeight.iconButton,
                      width: theme.componentHeight.iconButton,
                      borderRadius: theme.componentHeight.iconButton / 2,
                    },
                  ]}
                >
                  <ArrowRight
                    size={20}
                    color={text.trim() ? "#FFFFFF" : theme.colors.text.muted}
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
                contentContainerStyle={[
                  styles.scrollContent,
                  { padding: theme.spacing.xl },
                ]}
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
                    style={[
                      theme.typography.body,
                      styles.textInput,
                      { color: theme.colors.text.primary },
                    ]}
                    multiline
                    autoFocus
                    textAlignVertical="top"
                  />
                </View>

                {/* Footer Info */}
                <View
                  style={[
                    styles.footer,
                    {
                      marginTop: theme.spacing.lg,
                      paddingHorizontal: theme.spacing.xs,
                    },
                  ]}
                >
                  <View style={styles.aiHint}>
                    <Sparkles size={14} color={theme.colors.accent.primary} strokeWidth={2} />
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.text.secondary, marginLeft: theme.spacing.sm },
                      ]}
                    >
                      AI will create title, summary & tags
                    </Text>
                  </View>
                  <Text
                    style={[theme.typography.caption, { color: theme.colors.text.muted }]}
                  >
                    {charCount} characters
                  </Text>
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
            {stage === "preview" && ideaData && (
              <ScrollView
                style={styles.previewScrollView}
                contentContainerStyle={[styles.previewContainer, { paddingHorizontal: theme.spacing.xl }]}
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
                    onPress={handleBack}
                  >
                    <RefreshCw size={18} color={theme.colors.text.primary} strokeWidth={2} />
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        { color: theme.colors.text.primary, marginLeft: theme.spacing.sm },
                      ]}
                    >
                      Edit
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
              <View style={[styles.duplicateContainer, { paddingHorizontal: theme.spacing.xl }]}>
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
