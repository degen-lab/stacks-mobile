import { ArrowUpRight, ArrowDownLeft } from "lucide-react-native";
import { SelectionCard, View } from "@/components/ui";

type TransferModeSelectorProps = {
  onSelectMode: (mode: "send" | "receive") => void;
};

export function TransferModeSelector({
  onSelectMode,
}: TransferModeSelectorProps) {
  return (
    <View className="px-5 pb-6 gap-3">
      <SelectionCard
        icon={<ArrowUpRight size={18} color="#0B0A0F" />}
        iconCircular
        title="Send"
        subtitle="Transfer crypto to another wallet"
        onPress={() => onSelectMode("send")}
      />

      <SelectionCard
        icon={<ArrowDownLeft size={18} color="#0B0A0F" />}
        iconCircular
        title="Receive"
        subtitle="Get crypto from another wallet"
        onPress={() => onSelectMode("receive")}
      />
    </View>
  );
}
