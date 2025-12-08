import React from "react";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { Plus } from "lucide-react-native";

/**
 * AppFAB - Floating action button with gradient
 */
export function AppFAB({
  onPress,
  icon,
  style,
  ...props
}) {
  const { theme, gradients } = useTheme();

  const fabSize = theme.componentHeight.fab;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        {
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          overflow: "hidden",
          ...theme.elevation.mid,
        },
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={gradients.fab}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon || <Plus size={24} color="#FFFFFF" strokeWidth={2} />}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default AppFAB;
