import { Check, Search } from "lucide-react-native";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "nativewind";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { Text, TokenAvatar, View, colors } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";
import type { SwapAsset } from "../types";

const TokenRow = memo(function TokenRow({
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
      className={`flex-row items-center gap-3 rounded-xl border px-4 py-3.5 ${
        isSelected
          ? "border-border-secondary bg-sand-200 dark:border-border-primary dark:bg-surface-secondary"
          : "border-surface-secondary bg-sand-100 dark:border-border-primary dark:bg-surface-primary"
      }`}
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
});

function TokenRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3.5 dark:border-border-primary dark:bg-surface-primary">
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
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

  const renderItem = useCallback(
    ({ item }: { item: SwapAsset }) => (
      <TokenRow
        token={item}
        isSelected={item.tokenId === selectedTokenId}
        onPress={() => onSelect(item)}
      />
    ),
    [selectedTokenId, onSelect],
  );
  const searchIconColor = isDark ? colors.charcoal[400] : colors.neutral[400];
  const placeholderColor = isDark
    ? resolveThemeTokenColor("dark", "--color-text-tertiary")
    : colors.neutral[400];
  const selectionColor = isDark
    ? resolveThemeTokenColor("dark", "--color-text-primary")
    : colors.neutral[900];

  return (
    <View className="flex-1 gap-3">
      <View className="flex-row items-center gap-2.5 rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3 dark:border-border-primary dark:bg-surface-primary">
        <Search size={15} color={searchIconColor} />
        <TextInput
          ref={searchRef}
          className="flex-1 font-instrument-sans text-base text-primary"
          placeholder="Search tokens"
          placeholderTextColor={placeholderColor}
          selectionColor={selectionColor}
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
        <BottomSheetFlatList
          style={styles.list}
          data={filtered}
          keyExtractor={(token) => token.tokenId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={renderItem}
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
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
  },
});
