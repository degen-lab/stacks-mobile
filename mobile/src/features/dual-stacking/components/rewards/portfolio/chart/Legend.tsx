import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { Text } from "@/components/ui/text";
import type { ChartLegendItem } from "./types";

type Props = {
  items: ChartLegendItem[];
};

function DashedSwatch({ color }: { color: string }) {
  return (
    <Svg width={40} height={2}>
      <Line
        x1="0"
        y1="1"
        x2="40"
        y2="1"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4,4"
      />
    </Svg>
  );
}

function SolidSwatch({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 40,
        height: 2,
        borderRadius: 1,
        backgroundColor: color,
      }}
    />
  );
}

export function ChartLegend({ items }: Props) {
  if (!items.length) return null;

  return (
    <View className="flex-row flex-wrap gap-x-4 gap-y-3">
      {items.map((item) => (
        <View key={item.id} className="flex-row items-center gap-2">
          {item.lineStyle === "dashed" ? (
            <DashedSwatch color={item.color} />
          ) : (
            <SolidSwatch color={item.color} />
          )}
          <Text className="font-instrument-sans-medium text-primary text-sm">
            {item.label}
          </Text>
          <Text className="font-instrument-sans-medium text-tertiary text-sm">
            {item.valueLabel ?? `(${item.apy.toFixed(2)}% APY)`}
          </Text>
        </View>
      ))}
    </View>
  );
}
