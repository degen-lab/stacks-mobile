import { View, Text } from "@/components/ui";

type Props = {
  selected?: boolean;
};

export function PoolInfo({ selected }: Props) {
  return (
    <View
      className={`mb-4 w-full rounded-xl border bg-surface-primary p-4 ${
        selected ? "border-surface-secondary" : "border-surface-secondary"
      }`}
    >
      <View className="flex-row items-center">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-stacks-blood-orange/10">
          <Text className="font-matter text-lg text-stacks-blood-orange">
            FP
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-3 mb-1">
                <Text className="font-matter text-lg text-primary">
                  Fast Pool
                </Text>

                <View className="rounded-full bg-secondary/10 px-2 py-0.5">
                  <Text className="text-xs font-instrument-sans font-medium text-secondary">
                    Non-custodial
                  </Text>
                </View>
                <View className="rounded-full bg-green-500/10 px-2 py-0.5">
                  <Text className="text-xs font-instrument-sans font-medium text-green-600">
                    0% Commission
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-instrument-sans text-secondary">
                The oldest stacking pool on Stacks
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
