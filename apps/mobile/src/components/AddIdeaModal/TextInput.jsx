import React from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Send } from "lucide-react-native";

export function TextInputView({
  textInput,
  onTextChange,
  onSubmit,
  isSubmitting,
  paddingAnimation,
  onFocus,
  onBlur,
}) {
  return (
    <Animated.View style={{ flex: 1, paddingBottom: paddingAnimation }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#1E1E1E",
          marginBottom: 12,
        }}
      >
        What's on your mind?
      </Text>
      <RNTextInput
        style={{
          flex: 1,
          backgroundColor: "#F5F5F5",
          borderRadius: 12,
          padding: 16,
          fontSize: 16,
          color: "#1E1E1E",
          textAlignVertical: "top",
        }}
        placeholder="Type your idea, thought, or note here..."
        value={textInput}
        onChangeText={onTextChange}
        multiline
        placeholderTextColor="#70757F"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <TouchableOpacity
        onPress={onSubmit}
        disabled={!textInput.trim() || isSubmitting}
        style={{
          backgroundColor: textInput.trim() ? "#5ABCA6" : "#E2E2E2",
          borderRadius: 12,
          paddingVertical: 16,
          marginTop: 16,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Send size={18} color={textInput.trim() ? "white" : "#A8ADB4"} />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 16,
            fontWeight: "600",
            color: textInput.trim() ? "white" : "#A8ADB4",
          }}
        >
          {isSubmitting ? "Saving..." : "Save Idea"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
