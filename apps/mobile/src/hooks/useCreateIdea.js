import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

export function useCreateIdea(onSuccess) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, source_type, source_url }) => {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, source_type, source_url }),
      });
      if (!response.ok) {
        throw new Error("Failed to create idea");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to save idea. Please try again.");
    },
  });
}
