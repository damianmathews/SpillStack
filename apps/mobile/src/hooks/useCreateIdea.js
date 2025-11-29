import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@spillstack_ideas";

// Helper to get stored ideas
async function getStoredIdeas() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
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
        category: category || "Ideas",
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

// Export helper for use in other components
export { getStoredIdeas, STORAGE_KEY };
