import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Moon,
  Sun,
  Trash2,
  Download,
  Shield,
  Bell,
  HelpCircle,
  ChevronRight,
  Sparkles,
  LogOut,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { signOut, user } = useFirebaseAuth();

  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
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
                { text: "Delete", style: "destructive" },
              ],
            ),
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          title: "Push Notifications",
          subtitle: "Receive reminders and updates",
          type: "switch",
          value: false,
          onToggle: () =>
            Alert.alert("Coming Soon", "Notifications will be available soon!"),
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
          onPress: () =>
            Alert.alert("Coming Soon", "Help center will be available soon!"),
        },
        {
          icon: Shield,
          title: "Privacy Policy",
          subtitle: "Learn how we protect your data",
          type: "navigation",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Privacy policy will be available soon!",
            ),
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
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 16,
          marginBottom: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={item.onPress}
        disabled={item.type === "switch"}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: item.type === "danger"
              ? `${theme.colors.error}15`
              : `${theme.colors.primary}15`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <IconComponent
            size={20}
            color={
              item.type === "danger" ? theme.colors.error : theme.colors.primary
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color:
                item.type === "danger" ? theme.colors.error : theme.colors.text,
              marginBottom: 2,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.textSecondary,
              lineHeight: 17,
            }}
          >
            {item.subtitle}
          </Text>
        </View>

        {item.type === "switch" && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={theme.colors.border}
          />
        )}

        {item.type === "navigation" && (
          <ChevronRight size={20} color={theme.colors.textTertiary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text
          style={{
            ...theme.typography.largeTitle,
            color: theme.colors.text,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={{ marginBottom: 28 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: theme.colors.textSecondary,
                marginBottom: 12,
                marginLeft: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {section.title}
            </Text>
            {section.items.map((item, itemIndex) =>
              renderSettingItem(item, itemIndex),
            )}
          </View>
        ))}

        {/* App Info */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 24,
            marginTop: 16,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Sparkles size={16} color={theme.colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              SpillStack
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textTertiary,
            }}
          >
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
