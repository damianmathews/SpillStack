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
import { LinearGradient } from "expo-linear-gradient";
import {
  Moon,
  Sun,
  Trash2,
  Download,
  Shield,
  Bell,
  HelpCircle,
  ChevronRight,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();

  const settingSections = [
    {
      title: "Appearance",
      items: [
        {
          icon: isDark ? Moon : Sun,
          title: "Dark Mode",
          subtitle: "Toggle between light and dark themes",
          type: "switch",
          value: isDark,
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: "Data & Privacy",
      items: [
        {
          icon: Download,
          title: "Export Data",
          subtitle: "Download all your ideas and notes",
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
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          ...theme.shadows.small,
        }}
        onPress={item.onPress}
        disabled={item.type === "switch"}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${theme.colors.primary}15`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
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
              fontSize: 16,
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
              fontSize: 14,
              color: theme.colors.textSecondary,
              lineHeight: 18,
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
              true: `${theme.colors.primary}40`,
            }}
            thumbColor={
              item.value ? theme.colors.primary : theme.colors.textTertiary
            }
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

      {/* Header with gradient */}
      <LinearGradient
        colors={theme.gradients.primary}
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: 30,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          Settings
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#FFFFFF",
            opacity: 0.9,
          }}
        >
          Customize your experience
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 16,
                marginLeft: 4,
              }}
            >
              {section.title}
            </Text>
            {section.items.map((item, itemIndex) =>
              renderSettingItem(item, itemIndex),
            )}
          </View>
        ))}

        {/* App version */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 20,
            marginTop: 20,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.textTertiary,
              marginBottom: 4,
            }}
          >
            Mind Organizer
          </Text>
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
