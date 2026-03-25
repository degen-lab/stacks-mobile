import { View } from "react-native";

import { Text } from "@/components/ui";
import colors from "@/components/ui/colors";

type StepNumberCircleIconProps = {
  value: number;
  filled?: boolean;
  size?: number;
};

export function StepNumberCircleIcon({
  value,
  filled = false,
  size = 20,
}: StepNumberCircleIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: filled ? colors.neutral[900] : colors.neutral[500],
        backgroundColor: filled ? colors.neutral[900] : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        className={`font-matter-sq-mono text-xs ${
          filled ? "text-white" : "text-sand-500"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
