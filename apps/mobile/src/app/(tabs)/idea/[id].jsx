import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
  Eye,
  ChevronDown,
  Plus,
  Sparkles,
  Link2,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { sampleIdeas, categories } from "@/data/sampleData";
import { getStoredIdeas, useUpdateIdea, useDeleteIdea } from "@/hooks/useCreateIdea";
import { findSimilarIdeas } from "@/services/ai";
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

  const getCategoryGradient = (category) => {
    const categoryMap = {
      Ideas: theme.gradients.primary,
      Learning: theme.gradients.cool,
      Projects: theme.gradients.accent,
      Inspiration: theme.gradients.warm,
      Research: theme.gradients.secondary,
      Personal: theme.gradients.primary,
      "Business Ideas": ["#4ECDC4", "#6EDDD6"],
    };
    return categoryMap[category] || theme.gradients.primary;
  };

  const getCategoryColor = (categoryName) => {
    const cat = categories.find((c) => c.name === categoryName);
    return cat?.color || theme.colors.primary;
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
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: theme.colors.error, textAlign: "center" }}>
          Idea not found.
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
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                setIsEditing(!isEditing);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
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

        {/* Title */}
        <View style={{ marginTop: 16 }}>
          {isEditing ? (
            <TextInput
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Title"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#FFFFFF",
                padding: 12,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
              multiline
            />
          ) : (
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#FFFFFF",
              }}
            >
              {idea.title}
            </Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Metadata Card */}
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          {/* Category */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: theme.colors.textTertiary, marginBottom: 6 }}>
              Category
            </Text>
            {isEditing ? (
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: theme.colors.surface,
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: getCategoryColor(editedCategory),
                    marginRight: 8,
                  }}
                />
                <Text style={{ color: theme.colors.text, flex: 1 }}>{editedCategory}</Text>
                <ChevronDown size={16} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: getCategoryColor(idea.category),
                  }}
                />
                <Text style={{ color: theme.colors.text, fontSize: 14 }}>{idea.category}</Text>
              </View>
            )}
          </View>

          {/* Date and source */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Clock size={16} color={theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                {formatDate(idea.created_at)}
              </Text>
            </View>

            {idea.source_type && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {idea.source_type === "voice" && <Tag size={16} color={theme.colors.textSecondary} />}
                {idea.source_type === "url" && <Link2 size={16} color={theme.colors.textSecondary} />}
                {idea.source_type === "text" && <Edit3 size={16} color={theme.colors.textSecondary} />}
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  {idea.source_type}
                </Text>
              </View>
            )}

            {idea.view_count > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Eye size={16} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  {idea.view_count} views
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 12, color: theme.colors.textTertiary, marginBottom: 8 }}>
              Tags
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(isEditing ? editedTags : idea.tags || []).map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => isEditing && removeTag(tag)}
                  disabled={!isEditing}
                  style={{
                    backgroundColor: `${theme.colors.primary}15`,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
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
                  {isEditing && <X size={12} color={theme.colors.primary} />}
                </TouchableOpacity>
              ))}

              {isEditing && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.surface,
                    borderRadius: 20,
                    paddingLeft: 12,
                    paddingRight: 4,
                  }}
                >
                  <TextInput
                    value={newTag}
                    onChangeText={setNewTag}
                    onSubmitEditing={addTag}
                    placeholder="Add tag"
                    placeholderTextColor={theme.colors.textTertiary}
                    style={{
                      color: theme.colors.text,
                      fontSize: 12,
                      width: 60,
                      paddingVertical: 6,
                    }}
                  />
                  <TouchableOpacity
                    onPress={addTag}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: theme.colors.primary,
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
            marginBottom: 20,
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

        {/* Similar Ideas Section */}
        {!isEditing && (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Sparkles size={18} color={theme.colors.secondary} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: theme.colors.text,
                }}
              >
                Similar Ideas
              </Text>
            </View>

            {loadingSimilar ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={theme.colors.secondary} />
                <Text style={{ color: theme.colors.textTertiary, marginTop: 8, fontSize: 13 }}>
                  Finding related ideas...
                </Text>
              </View>
            ) : similarIdeas.length > 0 ? (
              <View style={{ gap: 12 }}>
                {similarIdeas.map((simIdea) => (
                  <TouchableOpacity
                    key={simIdea.id}
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                      router.push(`/idea/${simIdea.id}`);
                    }}
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: theme.colors.text,
                        marginBottom: 4,
                      }}
                      numberOfLines={1}
                    >
                      {simIdea.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme.colors.textSecondary,
                      }}
                      numberOfLines={2}
                    >
                      {simIdea.summary || simIdea.content.substring(0, 80)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: getCategoryColor(simIdea.category),
                        }}
                      />
                      <Text style={{ fontSize: 11, color: theme.colors.textTertiary }}>
                        {simIdea.category}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={{ color: theme.colors.textTertiary, fontSize: 14, textAlign: "center" }}>
                No similar ideas found yet. Add more ideas to see connections!
              </Text>
            )}
          </View>
        )}
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
            disabled={updateMutation.isPending}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              opacity: updateMutation.isPending ? 0.7 : 1,
            }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Check size={20} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
                  Save Changes
                </Text>
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
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 16,
              padding: 8,
              width: "80%",
              maxHeight: "60%",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: theme.colors.text,
                textAlign: "center",
                paddingVertical: 12,
              }}
            >
              Select Category
            </Text>
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
                      padding: 14,
                      borderRadius: 8,
                      backgroundColor:
                        editedCategory === cat.name ? `${cat.color}20` : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: cat.color,
                        marginRight: 12,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: theme.colors.text,
                        fontWeight: editedCategory === cat.name ? "600" : "400",
                      }}
                    >
                      {cat.name}
                    </Text>
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
