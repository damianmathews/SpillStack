import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, Search } from "lucide-react-native";

export function Header({
  insets,
  searchQuery,
  onSearchChange,
  onAddPress,
  theme,
}) {
  return (
    <LinearGradient
      colors={theme.gradients.primary}
      style={{
        paddingTop: insets.top + 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
      }}
    >
      {/* Title Section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          Mind Organizer
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#FFFFFF",
            opacity: 0.9,
          }}
        >
          Capture, organize, and explore your ideas
        </Text>
      </View>

      {/* Search and Add Section */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Search Bar */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Search size={20} color="rgba(255,255,255,0.8)" />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search your ideas..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 16,
              color: "#FFFFFF",
            }}
          />
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={onAddPress}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "center",
            ...theme.shadows.medium,
          }}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
