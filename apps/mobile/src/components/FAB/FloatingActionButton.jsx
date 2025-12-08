import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";
import { Plus, X, Mic, Type, Link } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export function FloatingActionButton({ onVoice, onText, onLink }) {
  const { theme, isDark, gradients } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const animation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const toValue = isOpen ? 0 : 1;

    Animated.parallel([
      Animated.spring(animation, {
        toValue,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnimation, {
        toValue,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(!isOpen);
  };

  const handleOptionPress = (callback) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleMenu();
    setTimeout(() => callback(), 200);
  };

  const rotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Animation values for each option - 60px spacing, starting higher from FAB
  const voiceTranslate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -210],
  });

  const textTranslate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -145],
  });

  const linkTranslate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  const optionScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  const options = [
    {
      id: "voice",
      label: "Voice",
      icon: Mic,
      translate: voiceTranslate,
      onPress: onVoice,
      color: theme.colors.accent.primary,
    },
    {
      id: "text",
      label: "Text",
      icon: Type,
      translate: textTranslate,
      onPress: onText,
      color: theme.colors.accent.primary,
    },
    {
      id: "link",
      label: "Link",
      icon: Link,
      translate: linkTranslate,
      onPress: onLink,
      color: theme.colors.accent.primary,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: backdropOpacity, zIndex: 50 },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={toggleMenu}>
            <BlurView
              intensity={30}
              tint={isDark ? "dark" : "light"}
              style={{ flex: 1, backgroundColor: "rgba(5, 8, 17, 0.5)" }}
            />
          </Pressable>
        </Animated.View>
      )}

      {/* FAB Container */}
      <View style={styles.container}>
        {/* Option Buttons */}
        {options.map((option) => (
          <Animated.View
            key={option.id}
            style={[
              styles.optionContainer,
              {
                transform: [
                  { translateY: option.translate },
                  { scale: optionScale },
                ],
                opacity: animation,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: theme.colors.surface.level2,
                  borderColor: theme.colors.border.subtle,
                  height: theme.componentHeight.iconButton,
                  width: theme.componentHeight.iconButton,
                  borderRadius: theme.componentHeight.iconButton / 2,
                },
              ]}
              onPress={() => handleOptionPress(option.onPress)}
              activeOpacity={0.8}
            >
              <option.icon size={20} color={option.color} strokeWidth={2} />
            </TouchableOpacity>
            <Animated.View
              style={[
                styles.optionLabel,
                {
                  backgroundColor: theme.colors.surface.level2,
                  borderColor: theme.colors.border.subtle,
                  borderRadius: theme.radius.sm,
                  opacity: animation,
                },
              ]}
            >
              <AppText variant="subtitle" color="primary">
                {option.label}
              </AppText>
            </Animated.View>
          </Animated.View>
        ))}

        {/* Main FAB Button */}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              width: theme.componentHeight.fab,
              height: theme.componentHeight.fab,
              borderRadius: theme.componentHeight.fab / 2,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              ...theme.elevation.mid,
            },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Plus size={26} color={theme.colors.accent.primary} strokeWidth={2.5} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 20,
    alignItems: "center",
    zIndex: 100,
  },
  fab: {
    alignItems: "center",
    justifyContent: "center",
  },
  optionContainer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  optionButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  optionLabel: {
    position: "absolute",
    right: 56,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
});
