import { Text, View } from "@/components/ui";

type StatsCardsProps = {
  totalBalance: string | null;
  totalEarnings: number | null;
};

export function StatsCards({ totalBalance, totalEarnings }: StatsCardsProps) {
  const formattedEarnings =
    totalEarnings !== null ? `$${totalEarnings.toLocaleString()}` : "—";

  return (
    <View className="flex-row gap-4">
      <View
        className="flex-1 rounded-2xl border border-surface-secondary bg-sand-100 px-5 py-5"
        testID="earn-total-balance-card"
      >
        <Text className="text-xs font-instrument-sans-medium uppercase text-secondary">
          Total Balance
        </Text>
        <Text
          className="mt-2 text-3xl font-matter text-primary"
          numberOfLines={1}
        >
          {totalBalance ?? "—"}
        </Text>
      </View>

      <View
        className="flex-1 rounded-2xl border border-surface-secondary bg-sand-100 px-5 py-5"
        testID="earn-total-earnings-card"
      >
        <Text className="text-xs font-instrument-sans-medium uppercase text-secondary">
          Total Earnings
        </Text>
        <Text className="mt-2 text-3xl font-matter text-primary">
          {formattedEarnings}
        </Text>
      </View>
    </View>
  );
}
