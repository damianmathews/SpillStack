export async function POST(request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    // Use AI to extract and analyze content from the URL
    const aiResponse = await fetch("/integrations/anthropic-claude-sonnet-4/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that analyzes URLs and extracts meaningful content. When given a URL, try to understand what kind of content it might be (Twitter post, article, video, etc.) and provide a reasonable analysis. Since you cannot access the actual URL content, provide a reasonable interpretation based on the URL structure.`,
          },
          {
            role: "user",
            content: `Analyze this URL and provide meaningful content extraction: ${url}

Please provide:
1. The likely content type (tweet, article, video, etc.)
2. A brief description of what this URL likely contains
3. Any insights you can gather from the URL structure itself`,
          },
        ],
        json_schema: {
          name: "url_analysis",
          schema: {
            type: "object",
            properties: {
              content_type: { type: "string" },
              description: { type: "string" },
              extracted_content: { type: "string" },
              insights: { type: "string" },
            },
            required: [
              "content_type",
              "description",
              "extracted_content",
              "insights",
            ],
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

    return Response.json({
      url,
      ...analysis,
      content: `${analysis.description}\n\n${analysis.extracted_content}\n\nInsights: ${analysis.insights}`,
    });
  } catch (error) {
    console.error("Error analyzing URL:", error);
    return Response.json({ error: "Failed to analyze URL" }, { status: 500 });
  }
}
