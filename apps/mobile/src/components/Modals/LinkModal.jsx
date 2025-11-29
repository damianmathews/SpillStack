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
              style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
            >
              <X size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Save Link
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View
              style={[
                styles.comingSoonCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Link size={32} color={theme.colors.info} />
              </View>

              <View style={styles.badge}>
                <Clock size={12} color={theme.colors.warning} />
                <Text style={[styles.badgeText, { color: theme.colors.warning }]}>
                  Coming Soon
                </Text>
              </View>

              <Text style={[styles.comingTitle, { color: theme.colors.text }]}>
                Link Capture
              </Text>

              <Text style={[styles.comingDescription, { color: theme.colors.textSecondary }]}>
                Paste any URL and our AI will automatically extract the key information,
                summarize the content, and save it as an idea.
              </Text>

              <View style={styles.features}>
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
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                    <Text
                      style={[styles.featureText, { color: theme.colors.textSecondary }]}
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
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.closeFullButtonText, { color: theme.colors.text }]}>
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
  comingSoonCard: {
    width: "100%",
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  comingTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  comingDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  features: {
    width: "100%",
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 14,
  },
  closeFullButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
  },
  closeFullButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
