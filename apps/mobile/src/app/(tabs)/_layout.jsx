import { Tabs, router } from "expo-router";
import { Home, Library } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { BlurView } from "expo-blur";

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isDark
            ? "rgba(5, 8, 17, 0.92)"
            : "rgba(248, 250, 252, 0.92)",
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.subtle,
          paddingTop: theme.spacing.sm,
          paddingBottom: 28,
          height: theme.componentHeight.tabBar,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        ),
        tabBarActiveTintColor: theme.colors.accent.primary,
        tabBarInactiveTintColor: theme.colors.text.muted,
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: "600",
          marginTop: theme.spacing.xs,
        },
        tabBarIconStyle: {
          marginTop: theme.spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home
              color={color}
              size={22}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, focused }) => (
            <Library
              color={color}
              size={22}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Always navigate to the library index when tapping the tab
            e.preventDefault();
            router.replace("/(tabs)/library");
          },
        }}
      />
      {/* Hide old tabs - keeping files for backward compatibility but not shown in tab bar */}
      <Tabs.Screen
        name="tasks"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
    </Tabs>
  );
}
