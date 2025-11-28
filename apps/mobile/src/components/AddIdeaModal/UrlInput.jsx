import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Send } from "lucide-react-native";

export function UrlInput({
  urlInput,
  onUrlChange,
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
        Share a link
      </Text>
      <TextInput
        style={{
          backgroundColor: "#F5F5F5",
          borderRadius: 12,
          padding: 16,
          fontSize: 16,
          color: "#1E1E1E",
          marginBottom: 16,
        }}
        placeholder="Paste URL from Twitter, articles, videos..."
        value={urlInput}
        onChangeText={onUrlChange}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#70757F"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <TouchableOpacity
        onPress={onSubmit}
        disabled={!urlInput.trim() || isSubmitting}
        style={{
          backgroundColor: urlInput.trim() ? "#5ABCA6" : "#E2E2E2",
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Send size={18} color={urlInput.trim() ? "white" : "#A8ADB4"} />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 16,
            fontWeight: "600",
            color: urlInput.trim() ? "white" : "#A8ADB4",
          }}
        >
          {isSubmitting ? "Processing..." : "Analyze & Save"}
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "#A8ADB4",
          textAlign: "center",
        }}
      >
        We'll analyze the content and automatically organize it for you
      </Text>
    </Animated.View>
  );
}
