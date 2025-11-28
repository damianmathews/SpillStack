import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Mic, Square } from "lucide-react-native";

export function VoiceInput({
  isRecording,
  isTranscribing,
  isSubmitting,
  currentTime,
  onRecord,
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: isTranscribing
            ? "#FFA500"
            : isRecording
              ? "#FF4757"
              : "#5ABCA6",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: isTranscribing
            ? "#FFA500"
            : isRecording
              ? "#FF4757"
              : "#5ABCA6",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          onPress={onRecord}
          disabled={isTranscribing || isSubmitting}
        >
          {isRecording ? (
            <Square size={40} color="white" />
          ) : (
            <Mic size={40} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <Text
        style={{
          marginTop: 24,
          fontSize: 18,
          fontWeight: "600",
          color: "#1E1E1E",
          textAlign: "center",
        }}
      >
        {isSubmitting
          ? "Saving..."
          : isTranscribing
            ? "Transcribing..."
            : isRecording
              ? "Recording..."
              : "Tap to Record"}
      </Text>

      {isRecording && currentTime > 0 && (
        <Text
          style={{
            marginTop: 8,
            fontSize: 16,
            color: "#70757F",
          }}
        >
          {Math.floor(currentTime)}s
        </Text>
      )}

      <Text
        style={{
          marginTop: 16,
          fontSize: 14,
          color: "#A8ADB4",
          textAlign: "center",
        }}
      >
        {isTranscribing || isSubmitting
          ? "Processing your voice note with AI..."
          : "Record your thoughts and our AI will organize them for you"}
      </Text>
    </View>
  );
}
