import { SvgUri } from "react-native-svg";

import { Text, View } from "@/components/ui";
import GradientBorder from "@/components/ui/gradient-border";
import { useSvgAsset } from "@/hooks/use-svg-asset";

export type StatItem = {
  label: string;
  value: string;
  unit?: string;
  prefix?: string;
};

function StatCard({ label, value, unit, prefix }: StatItem) {
  return (
    <View className="flex-1 rounded-[14px] border border-surface-secondary bg-sand-100 px-3 py-4">
      <Text className="font-matter-sq-mono text-xs tracking-wide uppercase text-secondary">
        {label}
      </Text>
      <View className="mt-1 flex-row items-baseline">
        {prefix ? (
          <Text className="font-matter text-lg leading-5 text-sand-500">
            {prefix}
          </Text>
        ) : null}
        <Text
          className="font-matter text-lg leading-5 text-primary"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        {unit ? (
          <Text className="font-matter text-lg leading-5 text-secondary">
            {" "}
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function BridgeOverviewGrid({
  hero,
  items,
}: {
  hero: StatItem;
  items: StatItem[];
}) {
  const bitcoinCoinsUri = useSvgAsset(
    require("@/assets/images/bitcoin-coins.svg"),
  );

  return (
    <View className="gap-3">
      <GradientBorder
        borderRadius={14}
        borderBottomRightRadius={36}
        gradient={["#D5D3D1", "rgba(255, 152, 53, 1)"]}
        innerBackground="#F3F2F0"
        angle={85}
        hasShadow={false}
      >
        <View className="px-5 py-5">
          {bitcoinCoinsUri ? (
            <View className="absolute -bottom-3.5 -right-2.5 opacity-90">
              <SvgUri uri={bitcoinCoinsUri} width={146} height={80} />
            </View>
          ) : null}

          <Text className="font-matter-sq-mono text-sm tracking-wide uppercase text-secondary">
            {hero.label}
          </Text>
          <View className="mt-1 flex-row items-baseline">
            {hero.prefix ? (
              <Text className="font-matter text-3xl text-sand-500">
                {hero.prefix}
              </Text>
            ) : null}
            <Text className="font-matter text-3xl text-primary">
              {hero.value}
            </Text>
            {hero.unit ? (
              <Text className="font-matter text-3xl text-sand-500">
                {" "}
                {hero.unit}
              </Text>
            ) : null}
          </View>
        </View>
      </GradientBorder>

      <View className="gap-3">
        {Array.from({ length: Math.ceil(items.length / 2) }, (_, index) => {
          const left = items[index * 2];
          const right = items[index * 2 + 1];

          return (
            <View key={left.label} className="flex-row gap-3">
              <StatCard {...left} />
              {right ? <StatCard {...right} /> : <View className="flex-1" />}
            </View>
          );
        })}
      </View>
    </View>
  );
}
