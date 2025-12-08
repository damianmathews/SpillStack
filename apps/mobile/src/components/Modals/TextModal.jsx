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
import { X, Sparkles, Check } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useCreateIdea } from "@/hooks/useCreateIdea";
import { processIdea } from "@/services/ai";
import * as Haptics from "expo-haptics";

export function TextModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    setText("");
    setCharCount(0);
  };

  const createIdeaMutation = useCreateIdea(handleSuccess);

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
                    backgroundColor: theme.colors.surface,
                    height: theme.componentHeight.iconButton,
                    width: theme.componentHeight.iconButton,
                    borderRadius: theme.componentHeight.iconButton / 2,
                  },
                ]}
              >
                <X size={20} color={theme.colors.text} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[theme.typography.headline, { color: theme.colors.text }]}>
                {isProcessing ? "Processing..." : "New Idea"}
              </Text>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!text.trim() || isSubmitting}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: text.trim() && !isSubmitting
                      ? theme.colors.primary
                      : theme.colors.surface,
                    height: theme.componentHeight.iconButton,
                    width: theme.componentHeight.iconButton,
                    borderRadius: theme.componentHeight.iconButton / 2,
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator
                    size="small"
                    color={text.trim() ? "#FFFFFF" : theme.colors.textTertiary}
                  />
                ) : (
                  <Check
                    size={20}
                    color={text.trim() ? "#FFFFFF" : theme.colors.textTertiary}
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Content */}
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
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                  },
                ]}
              >
                <TextInput
                  value={text}
                  onChangeText={handleTextChange}
                  placeholder="What's on your mind?"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[
                    theme.typography.body,
                    styles.textInput,
                    { color: theme.colors.text },
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
                  <Sparkles size={14} color={theme.colors.primary} strokeWidth={2} />
                  <Text
                    style={[
                      theme.typography.footnote,
                      { color: theme.colors.textSecondary, marginLeft: theme.spacing.sm },
                    ]}
                  >
                    AI will create title, summary & tags
                  </Text>
                </View>
                <Text
                  style={[theme.typography.footnote, { color: theme.colors.textTertiary }]}
                >
                  {charCount} characters
                </Text>
              </View>
            </ScrollView>
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
});
