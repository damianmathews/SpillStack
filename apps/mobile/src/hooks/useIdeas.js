import { useQuery } from "@tanstack/react-query";

export function useIdeas(selectedCategory, searchQuery) {
  return useQuery({
    queryKey: ["ideas", selectedCategory, searchQuery],
    queryFn: async () => {
      let url = "/api/ideas?";
      if (selectedCategory !== "All") {
        url += `category=${encodeURIComponent(selectedCategory)}&`;
      }
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch ideas");
      }
      return response.json();
    },
  });
}
