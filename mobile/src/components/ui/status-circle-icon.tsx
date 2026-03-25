import { Check } from "lucide-react-native";
import { View } from "react-native";

import colors from "@/components/ui/colors";

type StatusCircleIconProps = {
  size?: number;
  iconSize?: number;
};

export function StatusCircleIcon({
  size = 20,
  iconSize = 14,
}: StatusCircleIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.success[600],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Check size={iconSize} color={colors.white} strokeWidth={2.5} />
    </View>
  );
}
