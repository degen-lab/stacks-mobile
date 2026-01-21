import { ScrollView, Text, View } from "@/components/ui";
import { ScrollView as NativeScrollView, TextInput } from "react-native";
import { useRef } from "react";

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
  const scrollRef = useRef<NativeScrollView | null>(null);
  const displayWords = words.length
    ? words
    : Array.from({ length: wordCount }, () => "");

  return (
    <ScrollView
      ref={scrollRef}
      style={{ maxHeight }}
      showsVerticalScrollIndicator={true}
    >
      <View className="flex-row flex-wrap gap-2">
        {displayWords.map((word, index) => {
          const isInvalid = invalidWordIndices.includes(index);
          const hasValue = word.trim().length > 0;

          return (
            <View
              key={index}
              className={`w-[48%] rounded-lg bg-white border px-4 py-3 ${
                isInvalid && hasValue
                  ? "border-red-500 bg-red-50"
                  : "border-sand-200"
              }`}
            >
              <Text
                className={`text-[10px] font-instrument-sans-medium mb-1 ${
                  isInvalid && hasValue ? "text-red-600" : "text-tertiary"
                }`}
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
                  placeholderTextColor="#B7B4B0"
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  style={{
                    fontFamily: "MatterSQMono",
                    fontSize: 14,
                    color: isInvalid && hasValue ? "#DC2626" : "#0C0C0D",
                    letterSpacing: 0.5,
                    padding: 0,
                    margin: 0,
                  }}
                />
              ) : (
                <Text
                  className="font-matter-sq-mono text-sm text-primary"
                  style={
                    revealed
                      ? { letterSpacing: 0.5, color: isInvalid && hasValue ? "#DC2626" : undefined }
                      : { opacity: 0.5, letterSpacing: 2 }
                  }
                >
                  {revealed ? word : "••••••••"}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
