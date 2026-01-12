import React from "react";
import { View, TouchableOpacity } from "react-native";
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
    <View
      style={{
        marginHorizontal: theme.spacing.xl,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
        backgroundColor: theme.colors.surface.level1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: "center",
      }}
    >
      {/* Label - centered */}
      <AppText
        style={{
          fontSize: 13,
          fontWeight: "400",
          color: theme.colors.text.muted,
          marginBottom: theme.spacing.sm,
        }}
      >
        What's on your mind?
      </AppText>

      {/* Buttons Row - centered */}
      <View style={{ flexDirection: "row", gap: theme.spacing.xl }}>
        <TouchableOpacity
          style={{
            width: 55,
            height: 55,
            borderRadius: 28,
            backgroundColor: theme.colors.accent.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => handlePress(onVoice)}
          activeOpacity={0.8}
        >
          <Mic size={25} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 55,
            height: 55,
            borderRadius: 28,
            backgroundColor: theme.colors.accent.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => handlePress(onText)}
          activeOpacity={0.8}
        >
          <Type size={25} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
