import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { X, Type, Mic, Link } from "lucide-react-native";

export function ModalHeader({
  insets,
  activeInputType,
  onInputTypeChange,
  onClose,
}) {
  return (
    <View
      style={{
        paddingTop: insets.top + 20,
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#EDEDED",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1E1E1E" }}>
          Capture Idea
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#F5F5F5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color="#70757F" />
        </TouchableOpacity>
      </View>

      {/* Input Type Selector */}
      <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
        <TouchableOpacity
          onPress={() => onInputTypeChange("text")}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: activeInputType === "text" ? "#5ABCA6" : "#F5F5F5",
          }}
        >
          <Type
            size={18}
            color={activeInputType === "text" ? "white" : "#70757F"}
          />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: "600",
              color: activeInputType === "text" ? "white" : "#70757F",
            }}
          >
            Text
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onInputTypeChange("voice")}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor:
              activeInputType === "voice" ? "#5ABCA6" : "#F5F5F5",
          }}
        >
          <Mic
            size={18}
            color={activeInputType === "voice" ? "white" : "#70757F"}
          />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: "600",
              color: activeInputType === "voice" ? "white" : "#70757F",
            }}
          >
            Voice
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onInputTypeChange("url")}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: activeInputType === "url" ? "#5ABCA6" : "#F5F5F5",
          }}
        >
          <Link
            size={18}
            color={activeInputType === "url" ? "white" : "#70757F"}
          />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: "600",
              color: activeInputType === "url" ? "white" : "#70757F",
            }}
          >
            Link
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
