import { Button, Text, View } from "@/components/ui";
import { TelegramIcon, WhatsappIcon, XIcon } from "@/components/ui/icons";
import { useColorScheme } from "nativewind";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";

type ReferralShareSectionProps = {
  disabled: boolean;
  onShare: () => void;
  onShareChannel: (channel: "x" | "telegram" | "whatsapp") => void;
};

export default function ReferralShareSection({
  disabled,
  onShare,
  onShareChannel,
}: ReferralShareSectionProps) {
  const { colorScheme } = useColorScheme();
  const socialIconColor = disabled
    ? resolveThemeTokenColor(
        colorScheme === "dark" ? "dark" : "light",
        "--color-text-tertiary",
      )
    : resolveThemeTokenColor(
        colorScheme === "dark" ? "dark" : "light",
        colorScheme === "dark"
          ? "--color-text-primary"
          : "--color-text-secondary",
      );

  return (
    <View className="">
      <Button
        size="lg"
        label="Share Your Code"
        onPress={onShare}
        disabled={disabled}
        variant="default"
        className="mb-4 rounded-full shadow-blood-orange dark:bg-stacks-blood-orange"
        textClassName="dark:text-white"
      />

      <View className="flex-row items-center gap-3 my-4">
        <View className="flex-1 h-px w-full bg-surface-secondary" />
        <Text className="text-xs font-instrument-sans-medium uppercase text-secondary text-center">
          or share via
        </Text>
        <View className="flex-1 h-px w-full bg-surface-secondary" />
      </View>

      <View className="flex-row justify-center gap-4">
        <Button
          size="icon"
          variant="outline"
          onPress={() => onShareChannel("x")}
          disabled={disabled}
          className="w-16 h-16 rounded-full dark:bg-surface-primary dark:border-border-primary"
          accessibilityLabel="Share on X"
        >
          <XIcon size={24} color={socialIconColor} />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onPress={() => onShareChannel("telegram")}
          disabled={disabled}
          className="w-16 h-16 rounded-full dark:bg-surface-primary dark:border-border-primary"
          accessibilityLabel="Share on Telegram"
        >
          <TelegramIcon size={24} color={socialIconColor} />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onPress={() => onShareChannel("whatsapp")}
          disabled={disabled}
          className="w-16 h-16 rounded-full dark:bg-surface-primary dark:border-border-primary"
          accessibilityLabel="Share on WhatsApp"
        >
          <WhatsappIcon size={24} color={socialIconColor} />
        </Button>
      </View>
    </View>
  );
}
