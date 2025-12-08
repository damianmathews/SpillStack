import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import {
  Lightbulb,
  CheckCircle2,
  FolderKanban,
  Search as SearchIcon,
  ChevronRight,
  Settings,
  Briefcase,
  Heart,
  Sparkles,
  Layers,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { FloatingActionButton } from "@/components/FAB/FloatingActionButton";
import { VoiceModal } from "@/components/Modals/VoiceModal";
import { TextModal } from "@/components/Modals/TextModal";
import { LinkModal } from "@/components/Modals/LinkModal";
import { AppScreen, AppText } from "@/components/primitives";

// Ideas categories (everything is an idea)
const ideaCategories = [
  {
    id: "all",
    title: "All Ideas",
    subtitle: "Browse all your captured ideas",
    icon: Layers,
    color: "#4F7DFF",
    route: "/(tabs)/library/ideas",
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
  {
    id: "business",
    title: "Business Ideas",
    subtitle: "Startup and business concepts",
    icon: Briefcase,
    color: "#8B5CF6",
    route: "/(tabs)/library/ideas?category=Business Ideas",
  },
  {
    id: "personal",
    title: "Personal",
    subtitle: "Personal thoughts and reminders",
    icon: Heart,
    color: "#EC4899",
    route: "/(tabs)/library/ideas?category=Personal",
  },
  {
    id: "creative",
    title: "Creative",
    subtitle: "Creative ideas and inspiration",
    icon: Sparkles,
    color: "#F59E0B",
    route: "/(tabs)/library/ideas?category=Creative",
  },
];

// Tasks category (standalone)
const tasksCategory = {
  id: "tasks",
  title: "Tasks",
  subtitle: "Your action items and to-dos",
  icon: CheckCircle2,
  color: "#22C55E",
  route: "/(tabs)/library/tasks",
};

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

  // Category Card Component - compact size
  const CategoryCard = ({ category }) => {
    const Icon = category.icon;
    return (
      <TouchableOpacity
        onPress={() => handleCategoryPress(category)}
        style={{
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.sm,
          marginBottom: 6,
          flexDirection: "row",
          alignItems: "center",
        }}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: `${category.color}15`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: theme.spacing.sm,
          }}
        >
          <Icon size={16} color={category.color} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color="primary" style={{ fontWeight: "500", fontSize: 14 }}>
            {category.title}
          </AppText>
          <AppText variant="caption" color="secondary" style={{ fontSize: 11 }}>
            {category.subtitle}
          </AppText>
        </View>
        <ChevronRight size={14} color={theme.colors.text.muted} />
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
        {/* IDEAS Section */}
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
          Ideas
        </AppText>

        {/* Idea Category Cards */}
        {ideaCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}

        {/* TASKS Section */}
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
          Tasks
        </AppText>

        {/* Tasks Category Card */}
        <CategoryCard category={tasksCategory} />
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
