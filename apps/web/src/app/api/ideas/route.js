import sql from "@/app/api/utils/sql";

// Create a new idea
export async function POST(request) {
  try {
    const body = await request.json();
    const { content, source_type, source_url } = body;

    if (!content || !source_type) {
      return Response.json(
        { error: "Content and source_type are required" },
        { status: 400 },
      );
    }

    // First, use AI to analyze and categorize the content
    const aiResponse = await fetch("/integrations/anthropic-claude-sonnet-4/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps organize ideas. Analyze the given content and provide:
1. A concise title (max 60 characters)
2. A summary (max 200 characters)
3. A category from the following options: Ideas, Learning, Projects, Inspiration, Research, Personal, To Do, Business Ideas, Life Hacks, Technology, Health & Wellness, Travel, Finance, Personal Growth, Creative Projects
4. 3-5 relevant tags
5. Topics (broader themes like "productivity", "health", "creativity", "business", "technology")

Choose the most specific and appropriate category. For actionable items, use "To Do". For business concepts, use "Business Ideas". For tips and tricks, use "Life Hacks".

The content may come from various sources like voice notes, typed text, or shared URLs.`,
          },
          {
            role: "user",
            content: `Analyze this content and organize it:\n\n${content}`,
          },
        ],
        json_schema: {
          name: "idea_analysis",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              category: {
                type: "string",
                enum: [
                  "Ideas",
                  "Learning",
                  "Projects",
                  "Inspiration",
                  "Research",
                  "Personal",
                  "To Do",
                  "Business Ideas",
                  "Life Hacks",
                  "Technology",
                  "Health & Wellness",
                  "Travel",
                  "Finance",
                  "Personal Growth",
                  "Creative Projects",
                ],
              },
              tags: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                maxItems: 5,
              },
              topics: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                maxItems: 3,
              },
            },
            required: ["title", "summary", "category", "tags", "topics"],
            additionalProperties: false,
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const analysis = JSON.parse(aiResult.choices[0].message.content);

    // Insert the idea into the database
    const [newIdea] = await sql`
      INSERT INTO ideas (
        title, content, summary, source_type, source_url, category, tags, topics
      ) VALUES (
        ${analysis.title}, ${content}, ${analysis.summary}, 
        ${source_type}, ${source_url || null}, ${analysis.category}, 
        ${analysis.tags}, ${analysis.topics}
      ) 
      RETURNING *
    `;

    return Response.json(newIdea);
  } catch (error) {
    console.error("Error creating idea:", error);
    return Response.json({ error: "Failed to create idea" }, { status: 500 });
  }
}

// Get all ideas with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check if this is the first time loading - if no ideas exist, seed some sample data
    const ideaCount = await sql`SELECT COUNT(*) as count FROM ideas`;
    if (ideaCount[0].count === "0") {
      // Seed some sample ideas
      await sql`
        INSERT INTO ideas (title, content, summary, source_type, category, tags, created_at) VALUES 
        ('Morning Workout Routine', 'I want to start doing 30-minute morning workouts to boost energy and productivity throughout the day. Maybe start with yoga and cardio alternating days.', 'Plan for daily 30-minute morning exercises alternating between yoga and cardio for better energy and productivity.', 'text', 'Personal', ARRAY['fitness', 'morning', 'productivity'], NOW() - INTERVAL '2 days'),
        ('Learn SwiftUI', 'Saw an interesting SwiftUI tutorial today. The declarative syntax looks really clean and modern. Should dedicate time to learn it properly for iOS development.', 'Explore SwiftUI tutorial for iOS development, focusing on its clean declarative syntax.', 'text', 'Learning', ARRAY['iOS', 'SwiftUI', 'programming'], NOW() - INTERVAL '1 day'),
        ('App Idea: Mind Mapper', 'What if we built an app that automatically organizes thoughts and ideas using AI? Users could speak or type ideas and it would categorize and summarize them intelligently.', 'AI-powered app concept for automatic thought organization with voice and text input capabilities.', 'text', 'Ideas', ARRAY['AI', 'app', 'productivity'], NOW() - INTERVAL '5 hours'),
        ('Team Standup Insights', 'Noticed our standups are getting longer. Maybe we should try async standups or limit each person to 2 minutes max. Could use a timer app.', 'Improve team standup efficiency with async format or 2-minute time limits using timer tools.', 'text', 'Projects', ARRAY['meetings', 'productivity', 'team'], NOW() - INTERVAL '3 hours'),
        ('Reading: Atomic Habits', 'Just finished chapter 3 of Atomic Habits. The concept of habit stacking is brilliant - linking new habits to existing ones makes them stick better.', 'Key insight from Atomic Habits: habit stacking technique for building lasting behavioral changes.', 'text', 'Learning', ARRAY['books', 'habits', 'self-improvement'], NOW() - INTERVAL '1 hour')
      `;
    }

    let query = `SELECT * FROM ideas WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        LOWER(title) LIKE LOWER($${paramCount}) OR 
        LOWER(content) LIKE LOWER($${paramCount}) OR 
        LOWER(summary) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const ideas = await sql(query, params);
    return Response.json(ideas);
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return Response.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}
