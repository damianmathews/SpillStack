import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import {
  addIdea as firestoreAddIdea,
  updateIdea as firestoreUpdateIdea,
  deleteIdea as firestoreDeleteIdea,
  getIdeas as firestoreGetIdeas,
} from "@/services/firestore";

export const STORAGE_KEY = "@spillstack_ideas"; // Keep for reference

// Helper to get stored ideas from Firestore
export async function getStoredIdeas() {
  try {
    const ideas = await firestoreGetIdeas();
    // Transform Firestore format to app format
    return ideas.map((idea) => ({
      ...idea,
      created_at: idea.createdAt?.toDate?.()?.toISOString() || idea.created_at || new Date().toISOString(),
      updated_at: idea.updatedAt?.toDate?.()?.toISOString() || idea.updated_at,
    }));
  } catch (e) {
    console.error("Error reading ideas from Firestore:", e);
    return [];
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
      // Create idea object for Firestore
      const ideaData = {
        title: title || content.split(/[.!?]/)[0].substring(0, 50),
        content: content,
        summary: summary || content.substring(0, 150),
        category: category || "Creative",
        source_type: source_type || "text",
        source_url: source_url || null,
        tags: tags || [],
        view_count: 0,
      };

      // Save to Firestore and get the document ID
      const docId = await firestoreAddIdea(ideaData);

      return {
        id: docId,
        ...ideaData,
        created_at: new Date().toISOString(),
      };
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
      // Update in Firestore
      await firestoreUpdateIdea(id, updates);

      return {
        id,
        ...updates,
        updated_at: new Date().toISOString(),
      };
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
      // Delete from Firestore
      await firestoreDeleteIdea(id);
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

