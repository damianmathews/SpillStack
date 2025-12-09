import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Mic, Type } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function QuickInputButtons({ onVoice, onText }) {
  const { theme } = useTheme();

  const handlePress = (callback) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    callback();
  };

  return (
    <View style={styles.container}>
      {/* Voice Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surface.level1,
            borderColor: theme.colors.border.subtle,
            borderRadius: theme.radius.lg,
          },
        ]}
        onPress={() => handlePress(onVoice)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: theme.colors.accent.softBg,
            },
          ]}
        >
          <Mic size={22} color={theme.colors.accent.primary} strokeWidth={2} />
        </View>
        <View style={styles.textContainer}>
          <AppText variant="subtitle" color="primary" style={{ fontWeight: "600" }}>
            Voice
          </AppText>
          <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
            Speak your idea
          </AppText>
        </View>
      </TouchableOpacity>

      {/* Text Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surface.level1,
            borderColor: theme.colors.border.subtle,
            borderRadius: theme.radius.lg,
          },
        ]}
        onPress={() => handlePress(onText)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: theme.colors.accent.softBg,
            },
          ]}
        >
          <Type size={22} color={theme.colors.accent.primary} strokeWidth={2} />
        </View>
        <View style={styles.textContainer}>
          <AppText variant="subtitle" color="primary" style={{ fontWeight: "600" }}>
            Text
          </AppText>
          <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
            Type or paste
          </AppText>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
});
