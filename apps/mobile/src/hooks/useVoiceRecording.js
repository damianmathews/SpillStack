import { useState, useRef, useEffect } from "react";
import { Alert } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { cleanupTranscription, processIdea } from "@/services/ai";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export function useVoiceRecording(onTranscriptionComplete) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recorderState, setRecorderState] = useState({ currentTime: 0 });

  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = async (retryCount = 0) => {
    try {
      console.log("Requesting permissions...");
      const { granted } = await Audio.requestPermissionsAsync();

      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Microphone access is needed for voice recording"
        );
        return false;
      }

      console.log("Setting audio mode...");
      // Retry audio mode setup with delays - handles "app in background" errors
      // that occur when the app is transitioning from OAuth flows or first launch
      let audioModeSet = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
          audioModeSet = true;
          break;
        } catch (audioError) {
          if (audioError.message?.includes("background") && attempt < 4) {
            console.log(`Audio session not ready, waiting... (attempt ${attempt + 1}/5)`);
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw audioError;
          }
        }
      }

      if (!audioModeSet) {
        throw new Error("Could not activate audio session. Please try again.");
      }

      console.log("Creating recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

      // Start timer
      startTimeRef.current = Date.now();
      setRecorderState({ currentTime: 0 });

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRecorderState({ currentTime: elapsed });
      }, 100);

      console.log("Recording started successfully");
      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", `Failed to start recording: ${error.message}`);
      return false;
    }
  };

  const stopRecording = async () => {
    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!recordingRef.current) {
        throw new Error("No recording in progress");
      }

      console.log("Stopping recording...");
      setIsRecording(false);
      setIsTranscribing(true);

      await recordingRef.current.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      console.log("Recording stopped, URI:", uri);

      if (!uri) {
        throw new Error("No recording URI available");
      }

      // Verify file exists and has content
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("Recording file info:", fileInfo);

      if (!fileInfo.exists) {
        throw new Error("Recording file does not exist");
      }

      if (fileInfo.size < 1000) {
        throw new Error(`Recording too short (${fileInfo.size} bytes). Please speak louder and longer.`);
      }

      // Step 1: Transcribe with OpenAI Whisper
      const rawTranscript = await transcribeWithOpenAI(uri);
      console.log("Raw transcription:", rawTranscript);

      // Step 2: Clean up the transcription (light touch)
      const cleanedContent = await cleanupTranscription(rawTranscript);
      console.log("Cleaned content:", cleanedContent);

      // Step 3: Process with AI to get title, summary, category, tags
      const aiProcessed = await processIdea(cleanedContent);
      console.log("AI processed:", aiProcessed);

      // Clean up recording reference
      recordingRef.current = null;

      // Call completion callback with full data
      if (onTranscriptionComplete) {
        onTranscriptionComplete({
          content: cleanedContent,           // The full cleaned transcript
          title: aiProcessed.title,          // AI-generated title
          summary: aiProcessed.summary,      // AI-generated summary
          category: aiProcessed.category,    // AI-suggested category
          tags: aiProcessed.tags,            // AI-extracted tags
          source_url: null,
        });
      }
    } catch (error) {
      console.error("Recording error:", error);
      recordingRef.current = null;
      Alert.alert(
        "Transcription Failed",
        error.message || "Please try recording again."
      );
    } finally {
      setIsTranscribing(false);
      setRecorderState({ currentTime: 0 });
    }
  };

  const transcribeWithOpenAI = async (audioUri) => {
    console.log("Starting OpenAI transcription for:", audioUri);

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to .env");
    }

    // Get file info for logging
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    console.log("Audio file size:", fileInfo.size, "bytes");

    // Use FileSystem.uploadAsync for proper multipart form data in React Native
    console.log("Calling OpenAI Whisper API...");

    const response = await FileSystem.uploadAsync(
      "https://api.openai.com/v1/audio/transcriptions",
      audioUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        mimeType: "audio/m4a",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        parameters: {
          model: "whisper-1",
          response_format: "json",
          language: "en",
        },
      }
    );

    console.log("Whisper API response status:", response.status);

    if (response.status !== 200) {
      let errorMessage = `Transcription failed (${response.status})`;
      try {
        const errorData = JSON.parse(response.body);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    const result = JSON.parse(response.body);

    if (!result.text?.trim()) {
      throw new Error("No speech detected. Please speak clearly and try again.");
    }

    return result.text.trim();
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return {
    isRecording,
    isTranscribing,
    recorderState,
    handleVoiceRecord,
  };
}
