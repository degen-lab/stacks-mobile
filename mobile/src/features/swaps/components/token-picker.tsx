import { Check, Search } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput } from "react-native";

import { Text, View, colors } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import type { SwapAsset } from "../types";
import { TokenAvatar } from "./token-avatar";

function TokenRow({
  isSelected,
  token,
  onPress,
}: {
  isSelected: boolean;
  token: SwapAsset;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tokenRow, isSelected && styles.tokenRowSelected]}
      onPress={onPress}
    >
      <TokenAvatar icon={token.icon} symbol={token.symbol} />
      <View className="flex-1">
        <Text className="font-matter text-base text-primary">
          {token.symbol}
        </Text>
        <Text className="font-instrument-sans text-sm text-secondary">
          {token.name}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        {isSelected ? <Check size={16} color={colors.primary[500]} /> : null}
        <Text className="font-instrument-sans text-sm text-primary">
          {token.balanceDisplay}
        </Text>
      </View>
    </Pressable>
  );
}

function TokenRowSkeleton() {
  return (
    <View style={styles.tokenRow}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </View>
      <View className="items-end gap-2">
        <Skeleton className="h-3.5 w-20 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </View>
    </View>
  );
}

const SKELETONS = Array.from({ length: 6 }, (_, i) => i);

type TokenPickerProps = {
  emptyMessage: string;
  isLoading?: boolean;
  selectedTokenId: string;
  tokens: SwapAsset[];
  onSelect: (token: SwapAsset) => void;
};

export function TokenPicker({
  emptyMessage,
  isLoading,
  selectedTokenId,
  tokens,
  onSelect,
}: TokenPickerProps) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.tokenId.toLowerCase().includes(q),
    );
  }, [search, tokens]);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2.5 rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3">
        <Search size={15} color={colors.neutral[400]} />
        <TextInput
          ref={searchRef}
          className="flex-1 font-instrument-sans text-base text-primary"
          placeholder="Search tokens"
          placeholderTextColor={colors.neutral[400]}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ padding: 0 }}
        />
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {SKELETONS.map((i) => (
            <TokenRowSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(token) => token.tokenId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <TokenRow
              token={item}
              isSelected={item.tokenId === selectedTokenId}
              onPress={() => onSelect(item)}
            />
          )}
          ListEmptyComponent={
            <View className="py-10">
              <Text className="text-center font-instrument-sans text-sm text-secondary">
                {emptyMessage}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 8,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tokenRowSelected: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[300],
  },
});
