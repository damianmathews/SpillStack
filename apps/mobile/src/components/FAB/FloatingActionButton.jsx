import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";
import { Plus, X, Mic, Type, Link } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

export function FloatingActionButton({ onVoice, onText, onLink }) {
  const { theme, isDark } = useTheme();
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

  // Animation values for each option
  const voiceTranslate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -180],
  });

  const textTranslate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120],
  });

  const linkTranslate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
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
      color: theme.colors.primary,
    },
    {
      id: "text",
      label: "Text",
      icon: Type,
      translate: textTranslate,
      onPress: onText,
      color: theme.colors.secondary,
    },
    {
      id: "link",
      label: "Link",
      icon: Link,
      translate: linkTranslate,
      onPress: onLink,
      color: theme.colors.info,
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
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
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
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => handleOptionPress(option.onPress)}
              activeOpacity={0.8}
            >
              <option.icon size={20} color={option.color} />
            </TouchableOpacity>
            <Animated.View
              style={[
                styles.optionLabel,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  opacity: animation,
                },
              ]}
            >
              <Text style={[styles.optionLabelText, { color: theme.colors.text }]}>
                {option.label}
              </Text>
            </Animated.View>
          </Animated.View>
        ))}

        {/* Main FAB Button */}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              ...theme.shadows.glow,
            },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  optionLabel: {
    position: "absolute",
    right: 60,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
