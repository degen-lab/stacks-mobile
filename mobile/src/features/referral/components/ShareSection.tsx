import { Button, Text, View } from "@/components/ui";
import { TelegramIcon, WhatsappIcon, XIcon } from "@/components/ui/icons";

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
  return (
    <View className="">
      <Button
        size="lg"
        label="Share Your Code"
        onPress={onShare}
        disabled={disabled}
        variant="default"
        className="mb-4 rounded-full shadow-blood-orange"
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
          className="w-16 h-16 rounded-full"
          accessibilityLabel="Share on X"
        >
          <XIcon size={24} />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onPress={() => onShareChannel("telegram")}
          disabled={disabled}
          className="w-16 h-16 rounded-full"
          accessibilityLabel="Share on Telegram"
        >
          <TelegramIcon size={24} />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onPress={() => onShareChannel("whatsapp")}
          disabled={disabled}
          className="w-16 h-16 rounded-full"
          accessibilityLabel="Share on WhatsApp"
        >
          <WhatsappIcon size={24} />
        </Button>
      </View>
    </View>
  );
}
