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
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="ideas" />
      <Stack.Screen name="tasks" />
    </Stack>
  );
}
