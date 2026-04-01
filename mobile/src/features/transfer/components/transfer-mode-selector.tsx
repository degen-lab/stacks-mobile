import { ArrowUpRight, ArrowDownLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { SelectionCard, View } from "@/components/ui";

type TransferModeSelectorProps = {
  onSelectMode: (mode: "send" | "receive") => void;
};

export function TransferModeSelector({
  onSelectMode,
}: TransferModeSelectorProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#C9C9C9" : "#0B0A0F";

  return (
    <View className="px-5 pb-6 gap-3">
      <SelectionCard
        icon={<ArrowUpRight size={18} color={iconColor} />}
        iconCircular
        title="Send"
        subtitle="Transfer crypto to another wallet"
        onPress={() => onSelectMode("send")}
      />

      <SelectionCard
        icon={<ArrowDownLeft size={18} color={iconColor} />}
        iconCircular
        title="Receive"
        subtitle="Get crypto from another wallet"
        onPress={() => onSelectMode("receive")}
      />
    </View>
  );
}
