import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Edit3,
  Share2,
  Trash2,
  Check,
  X,
  Clock,
  Tag,
  ChevronDown,
  Plus,
  Sparkles,
  Link2,
} from "lucide-react-native";
import { useTheme, categoryColors } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { sampleIdeas, categories } from "@/data/sampleData";
import { getStoredIdeas, useUpdateIdea, useDeleteIdea } from "@/hooks/useCreateIdea";
import { findSimilarIdeas } from "@/services/ai";
import { AppText } from "@/components/primitives";
import * as Haptics from "expo-haptics";

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedTags, setEditedTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Similar ideas state
  const [similarIdeaIds, setSimilarIdeaIds] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Check if this is a sample idea first
  const sampleIdea = sampleIdeas.find((idea) => idea.id === id);

  // Fetch user-created ideas from local storage
  const { data: localIdeas = [] } = useQuery({
    queryKey: ["localIdeas"],
    queryFn: getStoredIdeas,
  });

  // Check if this is a user-created idea
  const localIdea = localIdeas.find((idea) => idea.id === id);

  // Priority: local user idea > sample idea
  const idea = localIdea || sampleIdea;

  // All ideas for similar lookup
  const allIdeas = [...localIdeas, ...sampleIdeas];

  // Mutations
  const updateMutation = useUpdateIdea(() => {
    setIsEditing(false);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  });

  const deleteMutation = useDeleteIdea(() => {
    router.back();
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  });

  useEffect(() => {
    if (idea) {
      setEditedTitle(idea.title || "");
      setEditedContent(idea.content || "");
      setEditedSummary(idea.summary || "");
      setEditedCategory(idea.category || "Ideas");
      setEditedTags(idea.tags || []);

      // Find similar ideas
      loadSimilarIdeas();
    }
  }, [idea?.id]);

  const loadSimilarIdeas = async () => {
    if (!idea || allIdeas.length < 2) return;

    setLoadingSimilar(true);
    try {
      const similarIds = await findSimilarIdeas(idea, allIdeas);
      setSimilarIdeaIds(similarIds);
    } catch (e) {
      console.error("Failed to load similar ideas:", e);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleSave = async () => {
    if (!localIdea) {
      // Can't edit sample ideas
      Alert.alert("Cannot Edit", "Sample ideas cannot be edited. Create your own idea to edit it!");
      return;
    }

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    updateMutation.mutate({
      id: idea.id,
      updates: {
        title: editedTitle,
        content: editedContent,
        summary: editedSummary,
        category: editedCategory,
        tags: editedTags,
      },
    });
  };

  const handleDelete = () => {
    if (!localIdea) {
      Alert.alert("Cannot Delete", "Sample ideas cannot be deleted.");
      return;
    }

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
    Alert.alert(
      "Delete Idea",
      "Are you sure you want to delete this idea? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(idea.id),
        },
      ]
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

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !editedTags.includes(tag)) {
      setEditedTags([...editedTags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setEditedTags(editedTags.filter((t) => t !== tagToRemove));
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

  // Create a darkened gradient from the category color
  const getCategoryGradient = (categoryName) => {
    const baseColor = categoryColors[categoryName] || theme.colors.accent.primary;
    // Return a gradient from very dark version to slightly lighter dark version
    return [`${baseColor}`, `${baseColor}80`, `${baseColor}40`];
  };

  // Create darkened header colors based on category
  const getDarkCategoryColors = (categoryName) => {
    const baseColor = categoryColors[categoryName] || theme.colors.accent.primary;
    // Dark versions for the gradient (multiply effect)
    return [
      darkenColor(baseColor, 0.7), // Very dark
      darkenColor(baseColor, 0.5), // Medium dark
    ];
  };

  // Helper to darken a hex color
  const darkenColor = (hex, factor) => {
    // Remove # if present
    const color = hex.replace('#', '');
    const r = Math.floor(parseInt(color.substring(0, 2), 16) * factor);
    const g = Math.floor(parseInt(color.substring(2, 4), 16) * factor);
    const b = Math.floor(parseInt(color.substring(4, 6), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getCategoryColor = (categoryName) => {
    return categoryColors[categoryName] || theme.colors.accent.primary;
  };

  // Navigate to category filter
  const handleCategoryPress = (categoryName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/library/ideas?category=${encodeURIComponent(categoryName)}`);
  };

  // Get similar idea objects
  const similarIdeas = similarIdeaIds
    .map((simId) => allIdeas.find((i) => i.id === simId))
    .filter(Boolean);

  if (!idea) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.default,
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.xl,
        }}
      >
        <AppText variant="body" color="primary" style={{ textAlign: "center" }}>
          Idea not found.
        </AppText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.accent.primary,
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.sm,
          }}
        >
          <AppText variant="body" style={{ color: "#FFFFFF" }}>Go Back</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header with category-colored gradient */}
      <LinearGradient
        colors={getDarkCategoryColors(idea.category)}
        style={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          paddingHorizontal: theme.spacing.xl,
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
              width: theme.componentHeight.iconButton,
              height: theme.componentHeight.iconButton,
              borderRadius: theme.componentHeight.iconButton / 2,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: theme.componentHeight.iconButton,
                height: theme.componentHeight.iconButton,
                borderRadius: theme.componentHeight.iconButton / 2,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Share2 size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                setIsEditing(!isEditing);
              }}
              style={{
                width: theme.componentHeight.iconButton,
                height: theme.componentHeight.iconButton,
                borderRadius: theme.componentHeight.iconButton / 2,
                backgroundColor: isEditing ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
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
                width: theme.componentHeight.iconButton,
                height: theme.componentHeight.iconButton,
                borderRadius: theme.componentHeight.iconButton / 2,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title */}
        <View style={{ marginTop: theme.spacing.lg }}>
          {isEditing ? (
            <TextInput
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Title"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={{
                ...theme.typography.display,
                color: "#FFFFFF",
                padding: theme.spacing.md,
                borderRadius: theme.radius.sm,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
              multiline
            />
          ) : (
            <AppText variant="display" style={{ color: "#FFFFFF" }}>
              {idea.title}
            </AppText>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Metadata Card */}
        <View
          style={{
            backgroundColor: theme.colors.surface.level1,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.xl,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          {/* Category */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="caption" color="muted" style={{ marginBottom: theme.spacing.sm }}>
              Category
            </AppText>
            {isEditing ? (
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: theme.colors.surface.level2,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.sm,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: getCategoryColor(editedCategory),
                    marginRight: theme.spacing.sm,
                  }}
                />
                <AppText variant="body" color="primary" style={{ flex: 1 }}>{editedCategory}</AppText>
                <ChevronDown size={16} color={theme.colors.text.muted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleCategoryPress(idea.category)}
                style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: getCategoryColor(idea.category),
                  }}
                />
                <AppText variant="subtitle" style={{ color: getCategoryColor(idea.category) }}>{idea.category}</AppText>
              </TouchableOpacity>
            )}
          </View>

          {/* Date and source */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
              <Clock size={16} color={theme.colors.text.secondary} />
              <AppText variant="subtitle" color="secondary">
                {formatDate(idea.created_at)}
              </AppText>
            </View>

            {idea.source_type && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                {idea.source_type === "voice" && <Tag size={16} color={theme.colors.text.secondary} />}
                {idea.source_type === "url" && <Link2 size={16} color={theme.colors.text.secondary} />}
                {idea.source_type === "text" && <Edit3 size={16} color={theme.colors.text.secondary} />}
                <AppText variant="subtitle" color="secondary">
                  {idea.source_type}
                </AppText>
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="caption" color="muted" style={{ marginBottom: theme.spacing.sm }}>
              Tags
            </AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
              {(isEditing ? editedTags : idea.tags || []).map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (isEditing) {
                      removeTag(tag);
                    } else {
                      // Navigate to home with tag filter
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                      router.push({ pathname: "/(tabs)", params: { tag } });
                    }
                  }}
                  style={{
                    backgroundColor: theme.colors.accent.softBg,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.pill,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.xs,
                  }}
                >
                  <AppText variant="caption" style={{ color: theme.colors.accent.primary }}>
                    #{tag}
                  </AppText>
                  {isEditing && <X size={12} color={theme.colors.accent.primary} />}
                </TouchableOpacity>
              ))}

              {isEditing && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.surface.level2,
                    borderRadius: theme.radius.pill,
                    paddingLeft: theme.spacing.md,
                    paddingRight: theme.spacing.xs,
                  }}
                >
                  <TextInput
                    value={newTag}
                    onChangeText={setNewTag}
                    onSubmitEditing={addTag}
                    placeholder="Add tag"
                    placeholderTextColor={theme.colors.text.muted}
                    style={{
                      ...theme.typography.caption,
                      color: theme.colors.text.primary,
                      width: 60,
                      paddingVertical: theme.spacing.sm,
                    }}
                  />
                  <TouchableOpacity
                    onPress={addTag}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: theme.colors.accent.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Summary */}
        {(isEditing || idea.summary) && (
          <View
            style={{
              backgroundColor: theme.colors.surface.level2,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.xl,
            }}
          >
            <AppText variant="title" color="primary" style={{ marginBottom: theme.spacing.md }}>
              Summary
            </AppText>
            {isEditing ? (
              <TextInput
                value={editedSummary}
                onChangeText={setEditedSummary}
                placeholder="Add a summary..."
                placeholderTextColor={theme.colors.text.muted}
                style={{
                  ...theme.typography.body,
                  color: theme.colors.text.secondary,
                  backgroundColor: theme.colors.surface.level1,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.sm,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                multiline
              />
            ) : (
              <AppText variant="body" color="secondary">
                {idea.summary}
              </AppText>
            )}
          </View>
        )}

        {/* Content */}
        <View
          style={{
            backgroundColor: theme.colors.surface.level1,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.xl,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <AppText variant="title" color="primary" style={{ marginBottom: theme.spacing.lg }}>
            Content
          </AppText>
          {isEditing ? (
            <TextInput
              value={editedContent}
              onChangeText={setEditedContent}
              placeholder="Write your idea..."
              placeholderTextColor={theme.colors.text.muted}
              style={{
                ...theme.typography.body,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface.level2,
                padding: theme.spacing.md,
                borderRadius: theme.radius.sm,
                minHeight: 200,
                textAlignVertical: "top",
              }}
              multiline
            />
          ) : (
            <AppText variant="body" color="primary">
              {idea.content}
            </AppText>
          )}
        </View>

        {/* Similar Ideas Section */}
        {!isEditing && (
          <View
            style={{
              backgroundColor: theme.colors.surface.level1,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.xl,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
              <Sparkles size={18} color={theme.colors.accent.secondary} />
              <AppText variant="title" color="primary">
                Similar Ideas
              </AppText>
            </View>

            {loadingSimilar ? (
              <View style={{ alignItems: "center", paddingVertical: theme.spacing.xl }}>
                <ActivityIndicator size="small" color={theme.colors.accent.secondary} />
                <AppText variant="caption" color="muted" style={{ marginTop: theme.spacing.sm }}>
                  Finding related ideas...
                </AppText>
              </View>
            ) : similarIdeas.length > 0 ? (
              <View style={{ gap: theme.spacing.md }}>
                {similarIdeas.map((simIdea) => (
                  <TouchableOpacity
                    key={simIdea.id}
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                      router.push(`/idea/${simIdea.id}`);
                    }}
                    style={{
                      backgroundColor: theme.colors.surface.level2,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing.lg - 2,
                    }}
                  >
                    <AppText
                      variant="subtitle"
                      color="primary"
                      numberOfLines={1}
                      style={{ marginBottom: theme.spacing.xs }}
                    >
                      {simIdea.title}
                    </AppText>
                    <AppText variant="caption" color="secondary" numberOfLines={2}>
                      {simIdea.summary || simIdea.content.substring(0, 80)}
                    </AppText>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: getCategoryColor(simIdea.category),
                        }}
                      />
                      <AppText variant="caption" color="muted">
                        {simIdea.category}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <AppText variant="subtitle" color="muted" style={{ textAlign: "center" }}>
                No similar ideas found yet. Add more ideas to see connections!
              </AppText>
            )}
          </View>
        )}
      </ScrollView>

      {/* Save button when editing */}
      {isEditing && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + theme.spacing.xl,
            left: theme.spacing.xl,
            right: theme.spacing.xl,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={{
              backgroundColor: theme.colors.accent.primary,
              borderRadius: theme.radius.lg,
              height: theme.componentHeight.button,
              alignItems: "center",
              justifyContent: "center",
              opacity: updateMutation.isPending ? 0.7 : 1,
            }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                <Check size={20} color="#FFFFFF" />
                <AppText variant="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Save Changes
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(5, 8, 17, 0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface.level1,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.sm,
              width: "80%",
              maxHeight: "60%",
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          >
            <AppText
              variant="title"
              color="primary"
              style={{ textAlign: "center", paddingVertical: theme.spacing.md }}
            >
              Select Category
            </AppText>
            <ScrollView>
              {categories
                .filter((c) => c.name !== "All")
                .map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                      setEditedCategory(cat.name);
                      setShowCategoryPicker(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: theme.spacing.lg - 2,
                      borderRadius: theme.radius.sm,
                      backgroundColor:
                        editedCategory === cat.name ? theme.colors.accent.softBg : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: cat.color,
                        marginRight: theme.spacing.md,
                      }}
                    />
                    <AppText
                      variant="subtitle"
                      color="primary"
                      style={{ fontWeight: editedCategory === cat.name ? "600" : "400" }}
                    >
                      {cat.name}
                    </AppText>
                    {editedCategory === cat.name && (
                      <Check size={18} color={cat.color} style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
