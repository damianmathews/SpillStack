import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@spillstack_ideas";
const MIGRATION_KEY = "@spillstack_migrations";

// Category migrations - rename old categories to new ones
const CATEGORY_MIGRATIONS = {
  "Business Ideas": "Business",
  "Ideas": "Creative",
  "Thoughts": "Creative",
};

// Migrate a single idea's category if needed
function migrateIdeaCategory(idea) {
  if (idea.category && CATEGORY_MIGRATIONS[idea.category]) {
    return { ...idea, category: CATEGORY_MIGRATIONS[idea.category] };
  }
  return idea;
}

// Helper to get stored ideas (with automatic migration)
async function getStoredIdeas() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    let ideas = JSON.parse(stored);

    // Check if migration needed
    const needsMigration = ideas.some(
      (idea) => idea.category && CATEGORY_MIGRATIONS[idea.category]
    );

    if (needsMigration) {
      console.log("Migrating idea categories...");
      ideas = ideas.map(migrateIdeaCategory);
      // Save migrated data
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
      console.log("Category migration complete");
    }

    return ideas;
  } catch (e) {
    console.error("Error reading stored ideas:", e);
    return [];
  }
}

// Helper to save ideas
async function saveStoredIdeas(ideas) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch (e) {
    console.error("Error saving ideas:", e);
    throw e;
  }
}

export function useCreateIdea(onSuccess) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      title,
      summary,
      category,
      tags,
      source_type,
      source_url
    }) => {
      // Create new idea object using AI-processed data if available
      const newIdea = {
        id: `user-${Date.now()}`,
        title: title || content.split(/[.!?]/)[0].substring(0, 50),
        content: content,
        summary: summary || content.substring(0, 150),
        category: category || "Creative",
        source_type: source_type || "text",
        source_url: source_url || null,
        tags: tags || [],
        created_at: new Date().toISOString(),
        view_count: 0,
      };

      // Get existing ideas and add new one
      const existingIdeas = await getStoredIdeas();
      const updatedIdeas = [newIdea, ...existingIdeas];
      await saveStoredIdeas(updatedIdeas);

      return newIdea;
    },
    onSuccess: (newIdea) => {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["localIdeas"] });

      if (onSuccess) {
        onSuccess(newIdea);
      }
    },
    onError: (error) => {
      console.error("Create idea error:", error);
      Alert.alert("Error", "Failed to save idea. Please try again.");
    },
  });
}

// Hook for updating an idea
export function useUpdateIdea(onSuccess) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const existingIdeas = await getStoredIdeas();
      const index = existingIdeas.findIndex((idea) => idea.id === id);

      if (index === -1) {
        throw new Error("Idea not found");
      }

      const updatedIdea = {
        ...existingIdeas[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      existingIdeas[index] = updatedIdea;
      await saveStoredIdeas(existingIdeas);

      return updatedIdea;
    },
    onSuccess: (updatedIdea) => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["localIdeas"] });
      queryClient.invalidateQueries({ queryKey: ["idea", updatedIdea.id] });

      if (onSuccess) {
        onSuccess(updatedIdea);
      }
    },
    onError: (error) => {
      console.error("Update idea error:", error);
      Alert.alert("Error", "Failed to update idea. Please try again.");
    },
  });
}

// Hook for deleting an idea
export function useDeleteIdea(onSuccess) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const existingIdeas = await getStoredIdeas();
      const filteredIdeas = existingIdeas.filter((idea) => idea.id !== id);
      await saveStoredIdeas(filteredIdeas);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["localIdeas"] });

      if (onSuccess) {
        onSuccess(deletedId);
      }
    },
    onError: (error) => {
      console.error("Delete idea error:", error);
      Alert.alert("Error", "Failed to delete idea. Please try again.");
    },
  });
}

// Export helpers for use in other components
export { getStoredIdeas, saveStoredIdeas, STORAGE_KEY };
