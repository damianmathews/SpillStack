import React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { AppScreen, AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export default function PrivacyPolicy() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: theme.spacing.xl }}>
      <AppText
        variant="subtitle"
        color="primary"
        style={{
          fontWeight: "600",
          marginBottom: theme.spacing.md,
        }}
      >
        {title}
      </AppText>
      {children}
    </View>
  );

  const Paragraph = ({ children }) => (
    <AppText
      variant="body"
      color="secondary"
      style={{
        lineHeight: 22,
        marginBottom: theme.spacing.md,
      }}
    >
      {children}
    </AppText>
  );

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
          Privacy Policy
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
          variant="caption"
          color="muted"
          style={{ marginBottom: theme.spacing.xl }}
        >
          Last updated: December 2024
        </AppText>

        <Section title="Information We Collect">
          <Paragraph>
            SpillStack collects minimal data necessary to provide you with a seamless
            idea capture experience. This includes:
          </Paragraph>
          <Paragraph>
            - Account information (email address) when you sign in with Google
          </Paragraph>
          <Paragraph>
            - Ideas, tasks, and content you create within the app
          </Paragraph>
          <Paragraph>
            - Voice recordings processed temporarily for transcription (not stored)
          </Paragraph>
        </Section>

        <Section title="How We Use Your Information">
          <Paragraph>
            Your data is used solely to provide the SpillStack service. We use your
            information to:
          </Paragraph>
          <Paragraph>
            - Store and sync your ideas across devices
          </Paragraph>
          <Paragraph>
            - Process voice recordings to convert speech to text
          </Paragraph>
          <Paragraph>
            - Improve the app experience through aggregated, anonymized analytics
          </Paragraph>
        </Section>

        <Section title="Data Storage and Security">
          <Paragraph>
            Your ideas and tasks are stored securely on your device and optionally
            synced to our secure cloud servers. We employ industry-standard security
            measures including encryption in transit and at rest.
          </Paragraph>
          <Paragraph>
            Voice recordings are processed in real-time and are not stored on our
            servers after transcription is complete.
          </Paragraph>
        </Section>

        <Section title="Third-Party Services">
          <Paragraph>
            SpillStack uses the following third-party services:
          </Paragraph>
          <Paragraph>
            - Google Sign-In for authentication
          </Paragraph>
          <Paragraph>
            - OpenAI for AI-powered features (data is processed per their privacy policy)
          </Paragraph>
          <Paragraph>
            - Firebase for secure data storage
          </Paragraph>
        </Section>

        <Section title="Your Rights">
          <Paragraph>
            You have the right to:
          </Paragraph>
          <Paragraph>
            - Access your personal data at any time through the app
          </Paragraph>
          <Paragraph>
            - Export your data using the Export feature in Settings
          </Paragraph>
          <Paragraph>
            - Delete your data permanently using the Clear All Data option
          </Paragraph>
          <Paragraph>
            - Request deletion of your account by contacting support
          </Paragraph>
        </Section>

        <Section title="Data Retention">
          <Paragraph>
            We retain your data for as long as your account is active. If you delete
            your account, all associated data will be permanently removed within 30 days.
          </Paragraph>
        </Section>

        <Section title="Children's Privacy">
          <Paragraph>
            SpillStack is not intended for children under 13. We do not knowingly
            collect personal information from children under 13 years of age.
          </Paragraph>
        </Section>

        <Section title="Changes to This Policy">
          <Paragraph>
            We may update this privacy policy from time to time. We will notify you
            of any changes by posting the new policy in the app and updating the
            "Last updated" date.
          </Paragraph>
        </Section>

        <Section title="Contact Us">
          <Paragraph>
            If you have any questions about this Privacy Policy, please contact us
            at support@spillstack.com
          </Paragraph>
        </Section>
      </ScrollView>
    </AppScreen>
  );
}
