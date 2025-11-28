export async function POST(request) {
  try {
    const body = await request.json();
    const { audioUrl } = body;

    if (!audioUrl) {
      return Response.json({ error: "Audio URL is required" }, { status: 400 });
    }

    console.log("Starting transcription process for:", audioUrl);

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error(
        "Failed to download audio:",
        audioResponse.status,
        audioResponse.statusText,
      );
      throw new Error("Failed to download audio file");
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    console.log("Downloaded audio file, size:", audioBuffer.byteLength);

    // Check if we have the OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.",
      );
    }

    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    // Create a proper Blob object for the API
    const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "whisper-1");
    formData.append("response_format", "json");
    formData.append("language", "en");

    console.log("Calling OpenAI Whisper API...");
    // Call OpenAI Whisper API directly
    const transcriptionResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      },
    );

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("Whisper API error:", errorText);
      throw new Error(
        `Transcription failed: ${transcriptionResponse.status} - ${errorText}`,
      );
    }

    const transcriptionResult = await transcriptionResponse.json();
    console.log("Raw transcription result:", transcriptionResult);

    // Extract and clean up the transcribed text
    const transcribedText = transcriptionResult.text?.trim();

    if (!transcribedText) {
      console.log("No speech detected in transcription");
      return Response.json(
        {
          error: "No speech detected in audio",
        },
        { status: 400 },
      );
    }

    console.log("Transcribed text:", transcribedText);

    // Enhance the text using OpenAI's ChatGPT API directly
    let enhancedText = transcribedText; // fallback to original

    try {
      console.log("Enhancing text with ChatGPT...");

      const enhancementResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an AI assistant that helps organize and improve transcribed voice notes. Take the raw transcribed text and:
1. Fix any obvious transcription errors
2. Add proper punctuation and formatting
3. Organize the content in a clear, readable way
4. Preserve the original meaning and tone
5. If the content contains multiple ideas, organize them with bullet points or paragraphs

Keep the response natural and conversational, as if someone was sharing their thoughts.`,
              },
              {
                role: "user",
                content: `Please clean up and organize this transcribed voice note:\n\n"${transcribedText}"`,
              },
            ],
            max_tokens: 1000,
            temperature: 0.3,
          }),
        },
      );

      if (enhancementResponse.ok) {
        const enhancementResult = await enhancementResponse.json();
        enhancedText =
          enhancementResult.choices[0]?.message?.content || transcribedText;
        console.log("Enhanced text:", enhancedText);
      } else {
        const errorText = await enhancementResponse.text();
        console.warn(
          "Enhancement failed, using original transcription:",
          errorText,
        );
      }
    } catch (enhanceError) {
      console.warn(
        "Enhancement error, using original transcription:",
        enhanceError.message,
      );
    }

    return Response.json({
      originalTranscription: transcribedText,
      enhancedText: enhancedText,
      success: true,
    });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return Response.json(
      {
        error: `Transcription failed: ${error.message}`,
        details: error.stack,
      },
      { status: 500 },
    );
  }
}
