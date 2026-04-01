import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { twMerge } from "tailwind-merge";

import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";

import colors from "./colors";
import { Text } from "./text";

type AccordionCardProps = {
  title: string;
  body?: ReactNode;
  children?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  contentClassName?: string;
  testID?: string;
};

export function AccordionCard({
  title,
  body,
  children,
  isOpen,
  onToggle,
  className = "",
  contentClassName = "",
  testID,
}: AccordionCardProps) {
  const { colorScheme } = useColorScheme();
  const content =
    children ??
    (typeof body === "string" ? (
      <Text className="font-instrument-sans text-sm leading-6 text-secondary">
        {body}
      </Text>
    ) : (
      body
    ));
  const chevronColor =
    colorScheme === "dark"
      ? resolveThemeTokenColor("dark", "--color-text-secondary")
      : colors.secondary;

  return (
    <View
      className={twMerge(
        "rounded-[24px] border border-border-secondary bg-sand-100 px-5 py-5 shadow-elevation-light-l dark:border-border-primary dark:bg-surface-secondary dark:shadow-none",
        className,
      )}
      testID={testID ? `${testID}-root` : undefined}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        className="flex-row items-center justify-between gap-4 active:opacity-80"
        testID={testID ? `${testID}-trigger` : undefined}
      >
        <Text className="flex-1 font-matter text-lg text-primary">{title}</Text>
        <View
          testID={testID ? `${testID}-chevron` : undefined}
          style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
        >
          <ChevronDown size={18} color={chevronColor} />
        </View>
      </Pressable>

      {isOpen && content ? (
        <View
          className={twMerge("pt-4", contentClassName)}
          testID={testID ? `${testID}-content` : undefined}
        >
          {content}
        </View>
      ) : null}
    </View>
  );
}
