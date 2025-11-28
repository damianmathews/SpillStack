import React from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { Lightbulb } from "lucide-react-native";
import { IdeaCard } from "./IdeaCard";

export function IdeasGrid({
  ideas,
  isLoading,
  insets,
  refreshing,
  onRefresh,
  getCategoryColor,
  theme,
}) {
  const renderEmptyState = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40,
      }}
    >
      <Lightbulb size={64} color={theme.colors.textTertiary} />
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: theme.colors.textSecondary,
          textAlign: "center",
          marginBottom: 12,
          marginTop: 20,
        }}
      >
        No Ideas Yet
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: theme.colors.textTertiary,
          textAlign: "center",
          lineHeight: 24,
        }}
      >
        Start capturing your thoughts and ideas! {"\n"}Tap the + button to
        begin.
      </Text>
    </View>
  );

  const renderIdea = ({ item, index }) => (
    <IdeaCard
      idea={item}
      index={index}
      categoryColor={getCategoryColor(item.category)}
      theme={theme}
    />
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 80,
        }}
      >
        <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
          Loading your ideas...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={ideas}
      renderItem={renderIdea}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + 100,
      }}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      ListEmptyComponent={renderEmptyState}
    />
  );
}
