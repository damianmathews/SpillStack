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
import { X, Sparkles, Check } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useCreateIdea } from "@/hooks/useCreateIdea";
import { processIdea } from "@/services/ai";
import * as Haptics from "expo-haptics";
import { BouncingDotsLoader } from "@/components/LoadingAnimations/BouncingDotsLoader";
import { AppText } from "@/components/primitives";

export function TextModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const processingIntervalRef = useRef(null);

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    setText("");
    setCharCount(0);
  };

  const createIdeaMutation = useCreateIdea(handleSuccess);

  // Simulate progress during processing
  useEffect(() => {
    if (isProcessing) {
      setProcessingProgress(0);
      let progress = 0;
      processingIntervalRef.current = setInterval(() => {
        progress += (0.95 - progress) * 0.08;
        setProcessingProgress(Math.min(progress, 0.95));
      }, 200);
    } else {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      // Complete fill then reset
      if (processingProgress > 0.5) {
        setProcessingProgress(1);
        setTimeout(() => setProcessingProgress(0), 500);
      } else {
        setProcessingProgress(0);
      }
    }

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [isProcessing]);

  const handleTextChange = (value) => {
    setText(value);
    setCharCount(value.length);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setIsProcessing(true);

      // Process with AI to get title, summary, category, tags
      const aiProcessed = await processIdea(text.trim());

      // Save with AI-processed data
      createIdeaMutation.mutate({
        content: text.trim(),
        title: aiProcessed.title,
        summary: aiProcessed.summary,
        category: aiProcessed.category,
        tags: aiProcessed.tags,
        source_type: "text",
      });
    } catch (error) {
      console.error("AI processing failed:", error);
      // Fallback: save without AI processing
      createIdeaMutation.mutate({
        content: text.trim(),
        source_type: "text",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // If there's text entered, show confirmation
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
              setTimeout(() => {
                setText("");
                setCharCount(0);
              }, 300);
            },
          },
        ]
      );
      return;
    }

    onClose();
    setTimeout(() => {
      setText("");
      setCharCount(0);
    }, 300);
  };

  const isSubmitting = isProcessing || createIdeaMutation.isPending;

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
                {isProcessing ? "Processing..." : "New Idea"}
              </Text>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!text.trim() || isSubmitting}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: text.trim() && !isSubmitting
                      ? theme.colors.accent.primary
                      : theme.colors.surface.level1,
                    height: theme.componentHeight.iconButton,
                    width: theme.componentHeight.iconButton,
                    borderRadius: theme.componentHeight.iconButton / 2,
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator
                    size="small"
                    color={text.trim() ? "#FFFFFF" : theme.colors.text.muted}
                  />
                ) : (
                  <Check
                    size={20}
                    color={text.trim() ? "#FFFFFF" : theme.colors.text.muted}
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Content */}
            {isProcessing ? (
              <BouncingDotsLoader statusText="AI is thinking..." />
            ) : (
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
                    editable={!isSubmitting}
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
});
