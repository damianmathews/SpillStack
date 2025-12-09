import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Moon,
  Sun,
  Trash2,
  Download,
  Shield,
  HelpCircle,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { AppScreen, AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEY } from "@/hooks/useCreateIdea";

export default function SettingsModal() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { signOut, user } = useFirebaseAuth();

  const handleToggleTheme = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    toggleTheme();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              toast.error(error);
            } else {
              toast.success("Signed out successfully");
              router.replace("/auth");
            }
          },
        },
      ],
    );
  };

  const settingSections = [
    {
      title: "Account",
      items: [
        {
          icon: LogOut,
          title: "Sign Out",
          subtitle: user?.email || "Sign out of your account",
          type: "danger",
          onPress: handleSignOut,
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          icon: isDark ? Moon : Sun,
          title: "Dark Mode",
          subtitle: "Toggle between light and dark themes",
          type: "switch",
          value: isDark,
          onToggle: handleToggleTheme,
        },
      ],
    },
    {
      title: "Data & Privacy",
      items: [
        {
          icon: Download,
          title: "Export Data",
          subtitle: "Download all your ideas and tasks",
          type: "action",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Export feature will be available soon!",
            ),
        },
        {
          icon: Trash2,
          title: "Clear All Data",
          subtitle: "Permanently delete all ideas",
          type: "danger",
          onPress: () =>
            Alert.alert(
              "Clear All Data",
              "Are you sure you want to delete all your ideas? This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await AsyncStorage.removeItem(STORAGE_KEY);
                      toast.success("All data cleared");
                    } catch (error) {
                      toast.error("Failed to clear data");
                    }
                  },
                },
              ],
            ),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          title: "Help & FAQ",
          subtitle: "Get help and find answers",
          type: "navigation",
          onPress: () => router.push("/faq"),
        },
        {
          icon: Shield,
          title: "Privacy Policy",
          subtitle: "Learn how we protect your data",
          type: "navigation",
          onPress: () => router.push("/privacy-policy"),
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => {
    const IconComponent = item.icon;

    return (
      <TouchableOpacity
        key={index}
        style={{
          backgroundColor: theme.colors.surface.level1,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm + 2,
          marginBottom: theme.spacing.sm,
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={item.onPress}
        disabled={item.type === "switch"}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radius.sm,
            backgroundColor: item.type === "danger"
              ? `${theme.colors.danger}15`
              : theme.colors.accent.softBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: theme.spacing.md,
          }}
        >
          <IconComponent
            size={16}
            color={
              item.type === "danger" ? theme.colors.danger : theme.colors.accent.primary
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <AppText
            variant="caption"
            color="primary"
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: item.type === "danger" ? theme.colors.danger : theme.colors.text.primary,
            }}
          >
            {item.title}
          </AppText>
          {item.subtitle && (
            <AppText variant="caption" color="secondary" style={{ fontSize: 11, marginTop: 2 }}>
              {item.subtitle}
            </AppText>
          )}
        </View>

        {item.type === "switch" && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{
              false: theme.colors.border.subtle,
              true: theme.colors.accent.primary,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={theme.colors.border.subtle}
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        )}

        {item.type === "navigation" && (
          <ChevronRight size={16} color={theme.colors.text.muted} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header with Logo and Close Button */}
      <View
        style={{
          paddingTop: insets.top + theme.spacing.sm,
          paddingHorizontal: theme.spacing.xl,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Logo centered */}
        <Image
          source={
            isDark
              ? require("../../assets/spillstack-logo-white.png")
              : require("../../assets/spillstack-logo-black.png")
          }
          style={{
            width: 440,
            height: 110,
            marginTop: -30,
            marginBottom: -40,
          }}
          resizeMode="contain"
        />

        {/* Close button - absolute right */}
        <TouchableOpacity
          onPress={handleClose}
          style={{
            position: "absolute",
            right: theme.spacing.xl,
            top: insets.top + theme.spacing.sm,
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
          <X size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={{ marginBottom: theme.spacing.md }}>
            <AppText
              variant="caption"
              color="muted"
              style={{
                marginBottom: theme.spacing.sm,
                marginLeft: theme.spacing.xs,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontSize: 11,
              }}
            >
              {section.title}
            </AppText>
            {section.items.map((item, itemIndex) =>
              renderSettingItem(item, itemIndex),
            )}
          </View>
        ))}

        {/* Version Info */}
        <View
          style={{
            alignItems: "center",
            paddingTop: theme.spacing.md,
            marginTop: theme.spacing.sm,
          }}
        >
          <AppText variant="caption" color="muted" style={{ fontSize: 11 }}>
            Version 1.1
          </AppText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
