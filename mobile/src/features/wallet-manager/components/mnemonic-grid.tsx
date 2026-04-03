import { Text, View } from "@/components/ui";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import { TextInput } from "react-native";

interface MnemonicWordGridProps {
  words: string[];
  revealed?: boolean;
  editable?: boolean;
  onWordChange?: (index: number, word: string) => void;
  wordCount?: 12 | 24;
  maxHeight?: number;
  invalidWordIndices?: number[];
}

export function MnemonicWordGrid({
  words,
  revealed = true,
  editable = false,
  onWordChange,
  wordCount = 24,
  maxHeight = 380,
  invalidWordIndices = [],
}: MnemonicWordGridProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const displayWords = words.length
    ? words
    : Array.from({ length: wordCount }, () => "");
  const placeholderTextColor = resolveThemeTokenColor(
    isDark ? "dark" : "light",
    "--color-text-tertiary",
  );
  const primaryTextColor = resolveThemeTokenColor(
    isDark ? "dark" : "light",
    "--color-text-primary",
  );
  const tertiaryTextColor = resolveThemeTokenColor(
    isDark ? "dark" : "light",
    "--color-text-tertiary",
  );
  const defaultCellBorderColor = resolveThemeTokenColor(
    isDark ? "dark" : "light",
    isDark ? "--color-border-primary" : "--color-sand-200",
  );
  const defaultCellBackgroundColor = resolveThemeTokenColor(
    isDark ? "dark" : "light",
    isDark ? "--color-surface-secondary" : "--color-surface-tertiary",
  );
  const invalidTextColor = isDark ? "#F87171" : "#DC2626";

  return (
    <BottomSheetScrollView
      style={{ maxHeight }}
      showsVerticalScrollIndicator={true}
    >
      <View className="flex-row flex-wrap gap-2">
        {displayWords.map((word, index) => {
          const isInvalid = invalidWordIndices.includes(index);
          const hasValue = word.trim().length > 0;
          const cellStyle =
            isInvalid && hasValue
              ? {
                  backgroundColor: isDark
                    ? "rgba(127, 29, 29, 0.22)"
                    : "#FEF2F2",
                  borderColor: isDark ? "rgba(127, 29, 29, 0.5)" : "#FECACA",
                }
              : {
                  backgroundColor: defaultCellBackgroundColor,
                  borderColor: defaultCellBorderColor,
                };
          const labelColor =
            isInvalid && hasValue ? invalidTextColor : tertiaryTextColor;
          const wordColor =
            isInvalid && hasValue ? invalidTextColor : primaryTextColor;

          return (
            <View
              key={index}
              className="w-[48%] rounded-lg border px-4 py-3"
              style={cellStyle}
            >
              <Text
                className="mb-1 text-[10px] font-instrument-sans-medium"
                style={{ color: labelColor }}
              >
                {index + 1}
              </Text>

              {editable ? (
                <TextInput
                  value={word}
                  onChangeText={(text) =>
                    onWordChange?.(index, text.trim().toLowerCase())
                  }
                  placeholder="word"
                  placeholderTextColor={placeholderTextColor}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  className="font-matter-sq-mono text-sm"
                  style={{
                    color: wordColor,
                    letterSpacing: 0.5,
                    padding: 0,
                    margin: 0,
                  }}
                />
              ) : (
                <Text
                  className="font-matter-sq-mono text-sm"
                  style={
                    revealed
                      ? {
                          letterSpacing: 0.5,
                          color: wordColor,
                        }
                      : { opacity: 0.5, letterSpacing: 2, color: wordColor }
                  }
                >
                  {revealed ? word : "••••••••"}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </BottomSheetScrollView>
  );
}
