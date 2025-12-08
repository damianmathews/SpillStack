import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { X, Link, Clock } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

export function LinkModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
              onPress={onClose}
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
              Save Link
            </Text>
            <View style={{ width: theme.componentHeight.iconButton }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View
              style={[
                styles.comingSoonCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.xxxl,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    marginBottom: theme.spacing.xl,
                  },
                ]}
              >
                <Link size={32} color={theme.colors.info} strokeWidth={2} />
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: `${theme.colors.warning}15`,
                    borderRadius: theme.borderRadius.md,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.xs,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                <Clock size={12} color={theme.colors.warning} strokeWidth={2} />
                <Text
                  style={[
                    theme.typography.caption1Medium,
                    { color: theme.colors.warning, marginLeft: theme.spacing.xs },
                  ]}
                >
                  Coming Soon
                </Text>
              </View>

              <Text
                style={[
                  theme.typography.title2,
                  { color: theme.colors.text, marginBottom: theme.spacing.md },
                ]}
              >
                Link Capture
              </Text>

              <Text
                style={[
                  theme.typography.callout,
                  {
                    color: theme.colors.textSecondary,
                    textAlign: "center",
                    marginBottom: theme.spacing.xxl,
                  },
                ]}
              >
                Paste any URL and our AI will automatically extract the key information,
                summarize the content, and save it as an idea.
              </Text>

              <View style={[styles.features, { gap: theme.spacing.md }]}>
                {[
                  "Extract article content",
                  "Summarize key points",
                  "Auto-categorize",
                  "Save for later",
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View
                      style={[
                        styles.featureDot,
                        {
                          backgroundColor: theme.colors.primary,
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        theme.typography.subhead,
                        { color: theme.colors.textSecondary, marginLeft: theme.spacing.md },
                      ]}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeFullButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                  height: theme.componentHeight.button,
                  marginTop: theme.spacing.xl,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>
                Got it
              </Text>
            </TouchableOpacity>
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
  comingSoonCard: {
    width: "100%",
    borderWidth: 1,
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
  },
  features: {
    width: "100%",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureDot: {},
  closeFullButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
