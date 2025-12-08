import { Stack } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function LibraryLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="ideas" options={{ gestureEnabled: true }} />
      <Stack.Screen name="tasks" options={{ gestureEnabled: true }} />
    </Stack>
  );
}
