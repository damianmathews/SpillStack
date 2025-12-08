/**
 * SpillStack AI Service
 * Centralized AI processing with specialized prompts for different use cases
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

/**
 * System prompts for different AI operations
 */
const PROMPTS = {
  // For Ideas: Create a concise summary - Elon Musk style
  ideaSummary: `Summarize this in 1-2 short sentences. Be direct and concise like Elon Musk tweets.

Rules:
- ONLY use information explicitly stated in the input
- NEVER add details, examples, or specifics not mentioned
- NEVER hallucinate or infer things not directly said
- No fluff words, no filler, no corporate speak
- Max 120 characters
- If input is vague, keep summary vague

Return ONLY the summary text.`,

  // For generating titles - no colons, no AI speak
  ideaTitle: `Create a short title (2-5 words) for this content.

Rules:
- NO colons ever
- NO generic words like "Exploring", "Understanding", "Journey", "Comprehensive"
- NO AI-sounding phrases
- Be specific to the actual content
- ONLY reference things explicitly mentioned
- Simple, direct, like a text message subject line

Return ONLY the title, no quotes.`,

  // For categorizing ideas automatically
  ideaCategory: `Categorize this into exactly ONE category.

Categories:
- Projects: things to build, development, implementation, coding
- Research: articles, studies, investigation, learning, education
- Personal: life, family, health, self, reminders
- Business Ideas: startups, monetization, business, entrepreneurship
- Creative: art, design, writing, music, inspiration

Return ONLY the category name, nothing else.`,

  // For extracting tags from content
  ideaTags: `Extract 2-3 tags from this content.

Rules:
- ONLY use words/concepts explicitly in the content
- NEVER invent or assume tags
- Single words preferred
- Lowercase, no hashtags

Return comma-separated tags only.`,

  // For Tasks: Extract actionable tasks from voice/text input
  taskExtraction: `You are an expert at extracting actionable tasks from natural language.

Given raw input (often rambling voice notes), extract clear, actionable tasks:
1. Each task should start with a verb
2. Be specific and completable
3. Remove filler words and rambling
4. If multiple tasks mentioned, list each on a new line

Return ONLY the task(s), one per line, no bullets or numbers.`,

  // For cleaning up voice transcriptions (light touch)
  transcriptionCleanup: `You clean up voice transcriptions with a light touch.

Fix only:
1. Obvious transcription errors
2. Missing punctuation
3. Run-on sentences

Keep the original meaning and tone. Don't summarize or shorten.
Return ONLY the cleaned text.`,
};

/**
 * Call OpenAI Chat API with a specific prompt
 */
async function callOpenAI(systemPrompt, userContent, options = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const { model = "gpt-4o-mini", maxTokens = 500, temperature = 0.3 } = options;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content?.trim() || "";
}

/**
 * Process an idea: generate title, summary, category, and tags
 */
export async function processIdea(rawContent) {
  console.log("Processing idea with AI...");

  // Run all AI calls in parallel for speed
  const [title, summary, category, tagsRaw] = await Promise.all([
    callOpenAI(PROMPTS.ideaTitle, rawContent, { maxTokens: 50 }).catch(() => null),
    callOpenAI(PROMPTS.ideaSummary, rawContent, { maxTokens: 200 }).catch(() => null),
    callOpenAI(PROMPTS.ideaCategory, rawContent, { maxTokens: 20 }).catch(() => "Personal"),
    callOpenAI(PROMPTS.ideaTags, rawContent, { maxTokens: 50 }).catch(() => ""),
  ]);

  // Parse tags
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  return {
    title: title || rawContent.split(/[.!?]/)[0].substring(0, 50),
    summary: summary || rawContent.substring(0, 150),
    category: category || "Personal",
    tags,
  };
}

/**
 * Clean up a voice transcription (light touch, preserve original)
 */
export async function cleanupTranscription(rawText) {
  console.log("Cleaning up transcription...");
  try {
    const cleaned = await callOpenAI(PROMPTS.transcriptionCleanup, rawText, {
      maxTokens: 1000,
      temperature: 0.2,
    });
    return cleaned || rawText;
  } catch (e) {
    console.warn("Cleanup failed, using original:", e.message);
    return rawText;
  }
}

/**
 * Extract tasks from natural language input
 */
export async function extractTasks(rawInput) {
  console.log("Extracting tasks from input...");
  try {
    const tasksRaw = await callOpenAI(PROMPTS.taskExtraction, rawInput, {
      maxTokens: 500,
    });

    // Split by newlines and filter empty
    const tasks = tasksRaw
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    return tasks;
  } catch (e) {
    console.warn("Task extraction failed:", e.message);
    // Fallback: return the input as a single task
    return [rawInput.trim()];
  }
}

/**
 * Generate just a summary for existing content
 */
export async function generateSummary(content) {
  console.log("Generating summary...");
  try {
    return await callOpenAI(PROMPTS.ideaSummary, content, { maxTokens: 200 });
  } catch (e) {
    console.warn("Summary generation failed:", e.message);
    return content.substring(0, 150);
  }
}

/**
 * Generate just a title for existing content
 */
export async function generateTitle(content) {
  console.log("Generating title...");
  try {
    return await callOpenAI(PROMPTS.ideaTitle, content, { maxTokens: 50 });
  } catch (e) {
    console.warn("Title generation failed:", e.message);
    return content.split(/[.!?]/)[0].substring(0, 50);
  }
}

/**
 * Find similar ideas based on content comparison
 */
export async function findSimilarIdeas(currentIdea, allIdeas) {
  // Filter out the current idea
  const otherIdeas = allIdeas.filter((idea) => idea.id !== currentIdea.id);

  if (otherIdeas.length === 0) {
    return [];
  }

  // Create a prompt with the current idea and list of other ideas
  const otherIdeasText = otherIdeas
    .map((idea, i) => `${i + 1}. [${idea.id}] ${idea.title}: ${idea.summary || idea.content.substring(0, 100)}`)
    .join("\n");

  const prompt = `You are an expert at finding thematic connections between ideas.

Given the CURRENT IDEA and a LIST OF OTHER IDEAS, identify which ideas are most similar or related.

CURRENT IDEA:
Title: ${currentIdea.title}
Content: ${currentIdea.content}
Category: ${currentIdea.category}

LIST OF OTHER IDEAS:
${otherIdeasText}

Return ONLY a JSON array of the IDs of the most similar ideas (max 3), ordered by relevance.
Example: ["sample-1", "sample-3"]

If no ideas are similar, return an empty array: []
Return ONLY the JSON array, nothing else.`;

  try {
    const response = await callOpenAI(prompt, "", { maxTokens: 100 });
    // Parse the JSON array
    const parsed = JSON.parse(response.trim());
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3);
    }
    return [];
  } catch (e) {
    console.warn("Similar ideas lookup failed:", e.message);
    return [];
  }
}

/**
 * Check if two ideas might be duplicates
 */
export async function checkDuplicate(newIdeaContent, existingIdeas) {
  if (existingIdeas.length === 0) {
    return { isDuplicate: false, similarTo: null };
  }

  const existingText = existingIdeas
    .map((idea, i) => `${i + 1}. [${idea.id}] ${idea.title}: ${idea.summary || idea.content.substring(0, 100)}`)
    .join("\n");

  const prompt = `You are checking if a new idea is a duplicate of existing ideas.

NEW IDEA:
${newIdeaContent}

EXISTING IDEAS:
${existingText}

If the new idea is essentially the same as an existing idea (same core concept, just worded differently), return the ID of that idea.
If it's similar but distinct, or completely different, return "none".

Return ONLY the ID or "none", nothing else.`;

  try {
    const response = await callOpenAI(prompt, "", { maxTokens: 50 });
    const result = response.trim().replace(/['"]/g, "");

    if (result === "none" || result === "") {
      return { isDuplicate: false, similarTo: null };
    }

    return { isDuplicate: true, similarTo: result };
  } catch (e) {
    console.warn("Duplicate check failed:", e.message);
    return { isDuplicate: false, similarTo: null };
  }
}

export default {
  processIdea,
  cleanupTranscription,
  extractTasks,
  generateSummary,
  generateTitle,
  findSimilarIdeas,
  checkDuplicate,
};
