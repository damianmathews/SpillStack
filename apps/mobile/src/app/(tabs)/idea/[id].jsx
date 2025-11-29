import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Edit3,
  Share2,
  Star,
  Trash2,
  Check,
  X,
  Clock,
  Tag,
  Eye,
  CheckSquare,
  Square,
  Calendar,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sampleIdeas } from "@/data/sampleData";
import { getStoredIdeas } from "@/hooks/useCreateIdea";

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedSummary, setEditedSummary] = useState("");

  // Check if this is a sample idea first
  const sampleIdea = sampleIdeas.find((idea) => idea.id === id);

  // Fetch user-created ideas from local storage
  const { data: localIdeas = [] } = useQuery({
    queryKey: ["localIdeas"],
    queryFn: getStoredIdeas,
  });

  // Check if this is a user-created idea
  const localIdea = localIdeas.find((idea) => idea.id === id);

  // Fetch individual idea from API (only if not sample or local)
  const {
    data: apiIdea,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["idea", id],
    queryFn: async () => {
      const response = await fetch(`/api/ideas/${id}`);
      if (!response.ok) throw new Error("Failed to fetch idea");
      return response.json();
    },
    enabled: !sampleIdea && !localIdea, // Only fetch from API if not found locally
  });

  // Priority: local user idea > sample idea > API idea
  const idea = localIdea || sampleIdea || apiIdea;

  useEffect(() => {
    if (idea) {
      setEditedTitle(idea.title || "");
      setEditedContent(idea.content || "");
      setEditedSummary(idea.summary || "");

      // Track view
      trackView();
    }
  }, [idea]);

  const trackView = async () => {
    try {
      await fetch(`/api/ideas/${id}/view`, {
        method: "POST",
      });
      queryClient.invalidateQueries({ queryKey: ["idea", id] });
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          summary: editedSummary,
        }),
      });

      if (!response.ok) throw new Error("Failed to save changes");

      queryClient.invalidateQueries({ queryKey: ["idea", id] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      setIsEditing(false);
      Alert.alert("Success", "Changes saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save changes");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Idea",
      "Are you sure you want to delete this idea? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`/api/ideas/${id}`, {
                method: "DELETE",
              });

              if (!response.ok) throw new Error("Failed to delete");

              queryClient.invalidateQueries({ queryKey: ["ideas"] });
              router.back();
              Alert.alert("Success", "Idea deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete idea");
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    if (!idea) return;

    try {
      await Share.share({
        message: `${idea.title}\n\n${idea.content}`,
        title: idea.title,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share idea");
    }
  };

  const toggleCompleted = async () => {
    if (idea.category !== "To Do") return;

    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !idea.completed,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      queryClient.invalidateQueries({ queryKey: ["idea", id] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryGradient = (category) => {
    const categoryMap = {
      Ideas: theme.gradients.primary,
      Learning: theme.gradients.cool,
      Projects: theme.gradients.accent,
      Inspiration: theme.gradients.warm,
      Research: theme.gradients.secondary,
      Personal: theme.gradients.primary,
      "To Do": ["#FF6B6B", "#FF8E8E"],
      "Business Ideas": ["#4ECDC4", "#6EDDD6"],
      "Life Hacks": ["#45B7D1", "#67C3DB"],
      Technology: ["#DDA0DD", "#E6B8E6"],
      "Health & Wellness": ["#98FB98", "#ADFCAD"],
      Travel: ["#F4A460", "#F6B481"],
      Finance: ["#20B2AA", "#4BC4BC"],
      "Personal Growth": ["#FF8C94", "#FFA3AA"],
      "Creative Projects": ["#B8860B", "#C99A2E"],
    };
    return categoryMap[category] || theme.gradients.primary;
  };

  // Show loading only for API fetches (not sample or local ideas)
  if (isLoading && !sampleIdea && !localIdea) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: theme.colors.text }}>Loading...</Text>
      </View>
    );
  }

  // Show error only if not found locally and there's an error
  if ((error || !idea) && !sampleIdea && !localIdea) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: theme.colors.error, textAlign: "center" }}>
          Error loading idea. Please try again.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header with gradient */}
      <LinearGradient
        colors={getCategoryGradient(idea.category)}
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Share2 size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isEditing ? (
                <X size={18} color="#FFFFFF" />
              ) : (
                <Edit3 size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {isEditing ? (
          <View style={{ marginTop: 16 }}>
            <TextInput
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Title"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#FFFFFF",
                marginBottom: 8,
                padding: 12,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
              multiline
            />
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  flex: 1,
                }}
              >
                {idea.title}
              </Text>

              {idea.category === "To Do" && (
                <TouchableOpacity onPress={toggleCompleted}>
                  {idea.completed ? (
                    <CheckSquare size={24} color="#FFFFFF" />
                  ) : (
                    <Square size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Metadata */}
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            ...theme.shadows.small,
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Tag size={16} color={theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                {idea.category}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Clock size={16} color={theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                {formatDate(idea.created_at)}
              </Text>
            </View>

            {idea.view_count > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Eye size={16} color={theme.colors.textSecondary} />
                <Text
                  style={{ color: theme.colors.textSecondary, fontSize: 14 }}
                >
                  {idea.view_count} views
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {idea.tags && idea.tags.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 12,
              }}
            >
              {idea.tags.map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: `${theme.colors.primary}15`,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Summary */}
        {(isEditing || idea.summary) && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 12,
              }}
            >
              Summary
            </Text>
            {isEditing ? (
              <TextInput
                value={editedSummary}
                onChangeText={setEditedSummary}
                placeholder="Add a summary..."
                placeholderTextColor={theme.colors.textTertiary}
                style={{
                  fontSize: 16,
                  lineHeight: 24,
                  color: theme.colors.textSecondary,
                  backgroundColor: theme.colors.card,
                  padding: 12,
                  borderRadius: 8,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                multiline
              />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  lineHeight: 24,
                  color: theme.colors.textSecondary,
                }}
              >
                {idea.summary}
              </Text>
            )}
          </View>
        )}

        {/* Content */}
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 16,
            padding: 20,
            ...theme.shadows.small,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: theme.colors.text,
              marginBottom: 16,
            }}
          >
            Content
          </Text>
          {isEditing ? (
            <TextInput
              value={editedContent}
              onChangeText={setEditedContent}
              placeholder="Write your idea..."
              placeholderTextColor={theme.colors.textTertiary}
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                padding: 12,
                borderRadius: 8,
                minHeight: 200,
                textAlignVertical: "top",
              }}
              multiline
            />
          ) : (
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: theme.colors.text,
              }}
            >
              {idea.content}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Save button when editing */}
      {isEditing && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 20,
            left: 20,
            right: 20,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              ...theme.shadows.medium,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Check size={20} color="#FFFFFF" />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Save Changes
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
