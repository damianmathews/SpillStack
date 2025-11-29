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
                style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
              >
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {isProcessing ? "Processing..." : "New Idea"}
              </Text>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!text.trim() || isSubmitting}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: text.trim() && !isSubmitting
                      ? theme.colors.primary
                      : theme.colors.surface,
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={text.trim() ? "#FFFFFF" : theme.colors.textTertiary} />
                ) : (
                  <Check
                    size={20}
                    color={text.trim() ? "#FFFFFF" : theme.colors.textTertiary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Content */}
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
                  placeholder="What's on your mind?"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[styles.textInput, { color: theme.colors.text }]}
                  multiline
                  autoFocus
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
              </View>

              {/* Footer Info */}
              <View style={styles.footer}>
                <View style={styles.aiHint}>
                  <Sparkles size={14} color={theme.colors.primary} />
                  <Text style={[styles.aiHintText, { color: theme.colors.textSecondary }]}>
                    AI will create title, summary & tags
                  </Text>
                </View>
                <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
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
});
