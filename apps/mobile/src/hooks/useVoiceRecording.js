import { useState } from "react";
import { Alert } from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from "expo-audio";
import useUpload from "@/utils/useUpload";

export function useVoiceRecording(onTranscriptionComplete) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [upload] = useUpload();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const requestPermissions = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert(
        "Permission Required",
        "Microphone access is needed for voice recording",
      );
      return false;
    }
    return true;
  };

  const handleVoiceRecord = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (isRecording) {
      // Stop recording
      try {
        await recorder.stop();
        setIsRecording(false);
        setIsTranscribing(true);

        console.log("Recording stopped, URI:", recorder.uri);

        if (!recorder.uri) {
          throw new Error("No recording found");
        }

        // Create a simple asset object for upload
        const audioAsset = {
          uri: recorder.uri,
          name: `voice-note-${Date.now()}.wav`,
          type: "audio/wav",
          mimeType: "audio/wav",
        };

        console.log("Uploading audio file...");
        const uploadResult = await upload({
          reactNativeAsset: audioAsset,
        });

        if (uploadResult.error) {
          throw new Error(`Upload failed: ${uploadResult.error}`);
        }

        console.log("Audio uploaded successfully:", uploadResult.url);
        console.log("Starting transcription...");

        // Transcribe the audio using our API
        const transcriptionResponse = await fetch("/api/transcribe-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioUrl: uploadResult.url }),
        });

        if (!transcriptionResponse.ok) {
          const errorData = await transcriptionResponse.json();
          throw new Error(
            errorData.error ||
              `Transcription failed with status ${transcriptionResponse.status}`,
          );
        }

        const transcriptionResult = await transcriptionResponse.json();
        console.log(
          "Transcription successful:",
          transcriptionResult.enhancedText,
        );

        // Call the callback with transcribed content
        if (onTranscriptionComplete) {
          onTranscriptionComplete({
            content: transcriptionResult.enhancedText,
            source_url: uploadResult.url,
          });
        }

        // Show success feedback
        Alert.alert("✅ Success!", "Voice note transcribed and saved!");
      } catch (error) {
        console.error("Voice recording error:", error);
        Alert.alert(
          "❌ Voice Recording Failed",
          `Error: ${error.message}\n\nPlease try recording again.`,
        );
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      try {
        await recorder.prepareToRecordAsync();
        await recorder.record();
        setIsRecording(true);
      } catch (error) {
        console.error("Recording start error:", error);
        Alert.alert("Error", `Failed to start recording: ${error.message}`);
      }
    }
  };

  return {
    isRecording,
    isTranscribing,
    recorderState,
    handleVoiceRecord,
  };
}
