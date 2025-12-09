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
          <Mic size={18} color={theme.colors.accent.primary} strokeWidth={2.5} />
        </View>
        <AppText variant="subtitle" color="primary" style={{ fontWeight: "600", fontSize: 15 }}>
          Voice
        </AppText>
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
          <Type size={18} color={theme.colors.accent.primary} strokeWidth={2.5} />
        </View>
        <AppText variant="subtitle" color="primary" style={{ fontWeight: "600", fontSize: 15 }}>
          Text
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
