import React, { useState } from "react";
import { View, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { useCreateIdea } from "@/hooks/useCreateIdea";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useKeyboardPadding } from "@/hooks/useKeyboardPadding";
import { ModalHeader } from "./ModalHeader";
import { TextInputView } from "./TextInput";
import { VoiceInput } from "./VoiceInput";
import { UrlInput } from "./UrlInput";

export function AddIdeaModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const [activeInputType, setActiveInputType] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const { paddingAnimation, handleInputFocus, handleInputBlur } =
    useKeyboardPadding(insets);

  const handleSuccess = () => {
    onClose();
    setTextInput("");
    setUrlInput("");
    setActiveInputType("text");
  };

  const createIdeaMutation = useCreateIdea(handleSuccess);

  const handleTranscriptionComplete = ({ content, source_url }) => {
    createIdeaMutation.mutate({
      content,
      source_type: "voice",
      source_url,
    });
  };

  const { isRecording, isTranscribing, recorderState, handleVoiceRecord } =
    useVoiceRecording(handleTranscriptionComplete);

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    createIdeaMutation.mutate({
      content: textInput.trim(),
      source_type: "text",
    });
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    try {
      // First analyze the URL
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze URL");
      }

      const analysis = await response.json();
      createIdeaMutation.mutate({
        content: analysis.content,
        source_type: "url",
        source_url: urlInput.trim(),
      });
    } catch (error) {
      Alert.alert("Error", "Failed to process URL");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <ModalHeader
            insets={insets}
            activeInputType={activeInputType}
            onInputTypeChange={setActiveInputType}
            onClose={onClose}
          />

          <View style={{ flex: 1, padding: 24 }}>
            {activeInputType === "text" && (
              <TextInputView
                textInput={textInput}
                onTextChange={setTextInput}
                onSubmit={handleTextSubmit}
                isSubmitting={createIdeaMutation.isPending}
                paddingAnimation={paddingAnimation}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            )}

            {activeInputType === "voice" && (
              <VoiceInput
                isRecording={isRecording}
                isTranscribing={isTranscribing}
                isSubmitting={createIdeaMutation.isPending}
                currentTime={recorderState.currentTime}
                onRecord={handleVoiceRecord}
              />
            )}

            {activeInputType === "url" && (
              <UrlInput
                urlInput={urlInput}
                onUrlChange={setUrlInput}
                onSubmit={handleUrlSubmit}
                isSubmitting={createIdeaMutation.isPending}
                paddingAnimation={paddingAnimation}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingAnimatedView>
    </Modal>
  );
}
