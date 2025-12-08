import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import {
  Lightbulb,
  CheckCircle2,
  BookOpen,
  FolderKanban,
  Search as SearchIcon,
  Tag,
  Archive,
  ChevronRight,
  Settings,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { FloatingActionButton } from "@/components/FAB/FloatingActionButton";
import { VoiceModal } from "@/components/Modals/VoiceModal";
import { TextModal } from "@/components/Modals/TextModal";
import { LinkModal } from "@/components/Modals/LinkModal";
import { AppScreen, AppText } from "@/components/primitives";

// Library categories with their routes and icons
const libraryCategories = [
  {
    id: "ideas",
    title: "Ideas",
    subtitle: "All your captured ideas",
    icon: Lightbulb,
    color: "#8B5CF6",
    route: "/(tabs)/library/ideas",
  },
  {
    id: "tasks",
    title: "Tasks",
    subtitle: "Your action items and to-dos",
    icon: CheckCircle2,
    color: "#22C55E",
    route: "/(tabs)/library/tasks",
  },
  {
    id: "learning",
    title: "Learning",
    subtitle: "Educational notes and insights",
    icon: BookOpen,
    color: "#3B82F6",
    route: "/(tabs)/library/ideas?category=Learning",
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "Project notes and plans",
    icon: FolderKanban,
    color: "#14B8A6",
    route: "/(tabs)/library/ideas?category=Projects",
  },
  {
    id: "research",
    title: "Research",
    subtitle: "Research and articles",
    icon: SearchIcon,
    color: "#F97316",
    route: "/(tabs)/library/ideas?category=Research",
  },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  // Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const handleCategoryPress = (category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(category.route);
  };

  // Category Card Component
  const CategoryCard = ({ category }) => {
    const Icon = category.icon;
    return (
      <TouchableOpacity
        onPress={() => handleCategoryPress(category)}
        style={{
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          flexDirection: "row",
          alignItems: "center",
        }}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.sm,
            backgroundColor: `${category.color}15`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: theme.spacing.md,
          }}
        >
          <Icon size={20} color={category.color} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body" color="primary" style={{ fontWeight: "500", marginBottom: 2 }}>
            {category.title}
          </AppText>
          <AppText variant="caption" color="secondary" style={{ fontSize: 12 }}>
            {category.subtitle}
          </AppText>
        </View>
        <ChevronRight size={18} color={theme.colors.text.muted} />
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen withGradient>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <AppText variant="display" color="primary">
            Library
          </AppText>
          <AppText variant="body" color="secondary" style={{ marginTop: theme.spacing.xs }}>
            Browse and organize your content
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings-modal")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.colors.surface.level1,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
          activeOpacity={0.7}
        >
          <Settings size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Label */}
        <AppText
          variant="subtitle"
          color="muted"
          style={{
            marginBottom: theme.spacing.md,
            marginTop: theme.spacing.md,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Categories
        </AppText>

        {/* Category Cards */}
        {libraryCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}

        {/* Additional Options Section */}
        <AppText
          variant="subtitle"
          color="muted"
          style={{
            marginBottom: theme.spacing.md,
            marginTop: theme.spacing.xl,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          More
        </AppText>

        {/* Tags */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Tags functionality - for now just show ideas
            router.push("/(tabs)/library/ideas");
          }}
          style={{
            backgroundColor: theme.colors.surface.level1,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.sm,
            flexDirection: "row",
            alignItems: "center",
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.sm,
              backgroundColor: `${theme.colors.accent.primary}15`,
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.md,
            }}
          >
            <Tag size={20} color={theme.colors.accent.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body" color="primary" style={{ fontWeight: "500", marginBottom: 2 }}>
              Tags
            </AppText>
            <AppText variant="caption" color="secondary" style={{ fontSize: 12 }}>
              Browse by tags
            </AppText>
          </View>
          <ChevronRight size={18} color={theme.colors.text.muted} />
        </TouchableOpacity>

        {/* Archive */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Archive functionality - for now just show ideas
            router.push("/(tabs)/library/ideas");
          }}
          style={{
            backgroundColor: theme.colors.surface.level1,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.sm,
            flexDirection: "row",
            alignItems: "center",
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.sm,
              backgroundColor: `${theme.colors.text.muted}15`,
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.md,
            }}
          >
            <Archive size={20} color={theme.colors.text.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body" color="primary" style={{ fontWeight: "500", marginBottom: 2 }}>
              Archive
            </AppText>
            <AppText variant="caption" color="secondary" style={{ fontSize: 12 }}>
              Archived items
            </AppText>
          </View>
          <ChevronRight size={18} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onVoice={() => setShowVoiceModal(true)}
        onText={() => setShowTextModal(true)}
        onLink={() => setShowLinkModal(true)}
      />

      {/* Modals */}
      <VoiceModal visible={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
      <TextModal visible={showTextModal} onClose={() => setShowTextModal(false)} />
      <LinkModal visible={showLinkModal} onClose={() => setShowLinkModal(false)} />
    </AppScreen>
  );
}
