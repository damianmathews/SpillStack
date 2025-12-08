import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { AppScreen, AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

const faqs = [
  {
    question: "How do I capture an idea?",
    answer:
      "Tap the + button on the home screen and choose Voice, Text, or Link. Voice lets you speak your idea which is automatically transcribed. Text lets you type directly. Link allows you to save and summarize web content.",
  },
  {
    question: "How does voice capture work?",
    answer:
      "When you select Voice, SpillStack uses advanced speech recognition to transcribe your spoken words in real-time. The AI then processes your transcription to create a structured idea with a title and summary. Your voice recording is processed instantly and is not stored.",
  },
  {
    question: "Can I use SpillStack offline?",
    answer:
      "Ideas you create are stored locally on your device, so you can view them offline. However, capturing new ideas via voice or using AI features requires an internet connection.",
  },
  {
    question: "How do I organize my ideas?",
    answer:
      "Ideas are automatically categorized by the AI when you capture them. You can browse by category in the Library tab, or use the search feature to find specific ideas.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your ideas are stored securely on your device and synced to our secure cloud servers. You can export your data at any time using the Export feature in Settings, and you can delete all data with the Clear All Data option.",
  },
  {
    question: "How do I create a task?",
    answer:
      "Go to Library > Tasks and tap the + button. You can create tasks using voice or text. SpillStack will help you capture and organize your tasks efficiently.",
  },
  {
    question: "Can I switch between light and dark mode?",
    answer:
      "Yes! Go to Settings (gear icon on home screen) and toggle Dark Mode on or off under the Appearance section.",
  },
  {
    question: "How do I sign out?",
    answer:
      "Go to Settings and tap Sign Out at the top of the page. You'll be asked to confirm before signing out.",
  },
  {
    question: "How do I delete an idea or task?",
    answer:
      "Swipe left on an idea or task to reveal the delete option, or tap on the item and look for the delete button. For tasks, you can also tap the trash icon next to each task.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use industry-standard encryption for all data in transit and at rest. Your voice recordings are processed in real-time and are never stored. See our Privacy Policy for more details.",
  },
];

export default function FAQ() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const toggleFaq = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const FAQItem = ({ item, index }) => {
    const isExpanded = expandedIndex === index;

    return (
      <TouchableOpacity
        onPress={() => toggleFaq(index)}
        style={{
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.md,
        }}
        activeOpacity={0.7}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <AppText
            variant="subtitle"
            color="primary"
            style={{ flex: 1, fontWeight: "600", paddingRight: theme.spacing.md }}
          >
            {item.question}
          </AppText>
          {isExpanded ? (
            <ChevronUp size={20} color={theme.colors.text.muted} />
          ) : (
            <ChevronDown size={20} color={theme.colors.text.muted} />
          )}
        </View>
        {isExpanded && (
          <AppText
            variant="body"
            color="secondary"
            style={{
              marginTop: theme.spacing.md,
              lineHeight: 22,
            }}
          >
            {item.answer}
          </AppText>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.colors.surface.level1,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            marginRight: theme.spacing.md,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <AppText variant="display" color="primary">
          Help & FAQ
        </AppText>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppText
          variant="body"
          color="secondary"
          style={{ marginBottom: theme.spacing.xl }}
        >
          Tap any question to see the answer.
        </AppText>

        {faqs.map((faq, index) => (
          <FAQItem key={index} item={faq} index={index} />
        ))}

        <View
          style={{
            marginTop: theme.spacing.xl,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.accent.softBg,
            borderRadius: theme.radius.lg,
          }}
        >
          <AppText
            variant="subtitle"
            color="primary"
            style={{ marginBottom: theme.spacing.sm }}
          >
            Still have questions?
          </AppText>
          <AppText variant="body" color="secondary">
            Contact us at support@spillstack.com and we'll be happy to help.
          </AppText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
