// Sample Ideas for SpillStack
export const sampleIdeas = [
  {
    id: "sample-1",
    title: "Habit Tracker App Idea",
    content: "Build a habit tracker that gamifies daily routines with XP points, streaks, and achievements. Could integrate with Apple Health for automatic tracking.",
    summary: "Gamified habit tracker app with XP, streaks, and Apple Health integration",
    category: "Ideas",
    source_type: "text",
    tags: ["app", "productivity", "gamification"],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    view_count: 5,
  },
  {
    id: "sample-2",
    title: "React Native Animation Research",
    content: "Need to dive deeper into Reanimated 3 and Moti for smoother animations. Check out the Skia integration for advanced graphics.",
    summary: "Research Reanimated 3, Moti, and Skia for React Native animations",
    category: "Research",
    source_type: "voice",
    tags: ["react-native", "animations", "development"],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    view_count: 3,
  },
  {
    id: "sample-3",
    title: "Q4 Product Roadmap Notes",
    content: "Key features for Q4: user onboarding flow redesign, analytics dashboard, team collaboration features, and API v2 launch.",
    summary: "Q4 priorities: onboarding, analytics, collaboration, API v2",
    category: "Projects",
    source_type: "voice",
    tags: ["roadmap", "planning", "product"],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    view_count: 8,
  },
  {
    id: "sample-4",
    title: "AI in Healthcare Article",
    content: "Fascinating article about how AI is being used for early disease detection, drug discovery, and personalized treatment plans. The accuracy rates are impressive.",
    summary: "AI applications in healthcare: disease detection, drug discovery, personalized medicine",
    category: "Research",
    source_type: "url",
    tags: ["AI", "healthcare", "technology"],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    view_count: 2,
  },
  {
    id: "sample-5",
    title: "Birthday Gift Ideas for Mom",
    content: "She mentioned wanting a new yoga mat, that cookbook from the show she likes, maybe a spa day gift card, or those fancy candles she likes.",
    summary: "Mom's birthday: yoga mat, cookbook, spa gift card, candles",
    category: "Personal",
    source_type: "text",
    tags: ["birthday", "gift", "family"],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    view_count: 4,
  },
  {
    id: "sample-6",
    title: "Startup Monetization Strategy",
    content: "Consider freemium model with premium features, or usage-based pricing for API calls. Could also explore enterprise licensing for larger teams.",
    summary: "Monetization options: freemium, usage-based pricing, enterprise licensing",
    category: "Business Ideas",
    source_type: "voice",
    tags: ["startup", "monetization", "business"],
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    view_count: 6,
  },
];

// Sample Tasks for SpillStack
export const sampleTasks = [
  {
    id: "task-1",
    title: "Review Q4 roadmap document",
    completed: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-2",
    title: "Send follow-up email to client",
    completed: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-3",
    title: "Book dentist appointment",
    completed: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-4",
    title: "Prepare presentation slides",
    completed: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-5",
    title: "Call mom for birthday",
    completed: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Categories with refined colors (Graphite + Iris palette)
export const categories = [
  { name: "All", color: "#4F7DFF" },
  { name: "Projects", color: "#14B8A6" },
  { name: "Research", color: "#F97316" },
  { name: "Personal", color: "#EC4899" },
  { name: "Business Ideas", color: "#8B5CF6" },
  { name: "Creative", color: "#F59E0B" },
];
