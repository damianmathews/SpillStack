/**
 * SpillStack AI Service
 * Centralized AI processing with specialized prompts for different use cases
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

/**
 * System prompts for different AI operations
 */
const PROMPTS = {
  // For Ideas: Create a concise, actionable summary that captures the essence
  ideaSummary: `You are an expert at distilling ideas into clear, actionable summaries.

Given a raw idea or thought, create a summary that:
1. Captures the core concept in 1-2 sentences
2. Highlights key actionable points
3. Uses clear, professional language
4. Is concise but comprehensive (max 150 characters)

Return ONLY the summary, no quotes, no labels, no extra text.`,

  // For generating a good title from content
  ideaTitle: `You are an expert at creating compelling, descriptive titles.

Given content, create a title that:
1. Is 3-7 words
2. Captures the main idea
3. Is engaging and clear
4. Uses title case

Return ONLY the title, no quotes, no punctuation at end.`,

  // For categorizing ideas automatically
  ideaCategory: `You are an expert at categorizing ideas.

Categories available:
- Ideas: New concepts, innovations, app ideas
- Learning: Educational content, skills to learn, research topics
- Projects: Actionable projects, things to build
- Research: Information gathering, articles, studies
- Personal: Personal life, family, friends, self-improvement
- Business Ideas: Monetization, startups, business strategies

Given the content, return ONLY the single best category name from the list above.`,

  // For extracting tags from content
  ideaTags: `You are an expert at extracting relevant tags from content.

Given content, extract 2-4 relevant tags that:
1. Are single words or short phrases
2. Capture key themes, technologies, or topics
3. Would help with searching/filtering

Return ONLY a comma-separated list of tags, lowercase, no hashtags.`,

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
    callOpenAI(PROMPTS.ideaCategory, rawContent, { maxTokens: 20 }).catch(() => "Ideas"),
    callOpenAI(PROMPTS.ideaTags, rawContent, { maxTokens: 50 }).catch(() => ""),
  ]);

  // Parse tags
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  return {
    title: title || rawContent.split(/[.!?]/)[0].substring(0, 50),
    summary: summary || rawContent.substring(0, 150),
    category: category || "Ideas",
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

export default {
  processIdea,
  cleanupTranscription,
  extractTasks,
  generateSummary,
  generateTitle,
};
