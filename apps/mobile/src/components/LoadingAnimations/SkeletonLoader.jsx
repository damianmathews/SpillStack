import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";

// Simple skeleton shimmer effect
const SkeletonBox = ({ width, height, borderRadius = 8, style }) => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surface.level2,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

// Skeleton for an idea card (matches RecentIdeaCard dimensions)
export const IdeaCardSkeleton = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        width: 180,
        height: 160,
        backgroundColor: theme.colors.surface.level1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: theme.spacing.md,
        marginRight: theme.spacing.md,
      }}
    >
      {/* Category badge skeleton */}
      <SkeletonBox
        width={60}
        height={20}
        borderRadius={theme.radius.sm}
        style={{ marginBottom: theme.spacing.sm }}
      />
      {/* Title skeleton */}
      <SkeletonBox
        width="90%"
        height={16}
        borderRadius={4}
        style={{ marginBottom: theme.spacing.xs }}
      />
      <SkeletonBox
        width="60%"
        height={16}
        borderRadius={4}
        style={{ marginBottom: theme.spacing.md }}
      />
      {/* Summary skeleton */}
      <SkeletonBox
        width="100%"
        height={12}
        borderRadius={4}
        style={{ marginBottom: theme.spacing.xs }}
      />
      <SkeletonBox
        width="80%"
        height={12}
        borderRadius={4}
        style={{ marginBottom: theme.spacing.md }}
      />
      {/* Date skeleton */}
      <SkeletonBox width={50} height={10} borderRadius={4} />
    </View>
  );
};

// Skeleton for a task item (matches AnimatedTaskItem dimensions)
export const TaskItemSkeleton = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface.level1,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        paddingVertical: 12,
        paddingHorizontal: theme.spacing.md,
        marginBottom: 8,
      }}
    >
      {/* Checkbox skeleton */}
      <SkeletonBox
        width={22}
        height={22}
        borderRadius={4}
        style={{ marginRight: theme.spacing.md }}
      />
      {/* Title skeleton */}
      <View style={{ flex: 1, marginRight: theme.spacing.md }}>
        <SkeletonBox width="70%" height={15} borderRadius={4} />
      </View>
      {/* Date skeleton */}
      <SkeletonBox width={40} height={12} borderRadius={4} />
    </View>
  );
};

// Row of idea card skeletons for horizontal scroll
export const IdeasRowSkeleton = ({ count = 3 }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <IdeaCardSkeleton key={index} />
      ))}
    </View>
  );
};

// List of task skeletons
export const TasksListSkeleton = ({ count = 3 }) => {
  const { theme } = useTheme();

  return (
    <View style={{ paddingHorizontal: theme.spacing.xl }}>
      {Array.from({ length: count }).map((_, index) => (
        <TaskItemSkeleton key={index} />
      ))}
    </View>
  );
};

export { SkeletonBox };
