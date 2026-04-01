import { Asset } from "expo-asset";
import { Image } from "react-native";
import { SvgUri } from "react-native-svg";

import { useColorScheme } from "nativewind";

import { Pressable, Skeleton, Text, View, colors } from "@/components/ui";
import { getSkinById } from "@/features/play/components/skins/types";
import { useSvgAsset } from "@/hooks/use-svg-asset";
import { useGameStore } from "@/lib/store/game";
import { maskValue } from "@/lib/format/mask-display-value";
import { formatPortfolioTokenAmount } from "@/lib/assets/portfolio";
import type { EarnRewardRow } from "../../types";
import { EarnProgramIcon } from "./rewards-sources-icon";

type EarnRewardsListProps = {
  rewardRows: EarnRewardRow[];
  isLoading: boolean;
  isBalanceVisible: boolean;
  onPressRewardRow: (row: EarnRewardRow) => void;
};

const SKIN_ICON_SIZE = 22;

function BridgeGameSkinIcon() {
  const selectedSkinId = useGameStore((state) => state.selectedSkinId);
  const skin = getSkinById(selectedSkinId);
  const svgUri = useSvgAsset(typeof skin.icon === "number" ? skin.icon : null);

  if (typeof skin.icon !== "number") return null;
  const asset = Asset.fromModule(skin.icon);
  if (asset.type === "svg") {
    if (!svgUri) return null;
    return (
      <SvgUri uri={svgUri} width={SKIN_ICON_SIZE} height={SKIN_ICON_SIZE} />
    );
  }
  return (
    <Image
      source={skin.icon}
      style={{
        width: SKIN_ICON_SIZE,
        height: SKIN_ICON_SIZE,
        resizeMode: "contain",
      }}
    />
  );
}

function RewardsLoadingSkeleton() {
  return (
    <View className="gap-2">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </View>
  );
}

function RewardRow({
  row,
  isBalanceVisible,
  onPress,
}: {
  row: EarnRewardRow;
  isBalanceVisible: boolean;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const valueDisplay = `${formatPortfolioTokenAmount(row.value, row.valueToken === "stx" ? 2 : 8)} ${row.valueToken.toUpperCase()}`;
  const isActive = row.statusTone !== "inactive";
  const titleColor = isActive
    ? isDark
      ? colors.neutral[100]
      : colors.neutral[900]
    : isDark
      ? colors.neutral[500]
      : colors.neutral[500];
  const mutedColor = isDark ? colors.neutral[400] : colors.neutral[600];
  const titleInsetClassName = row.id !== "dual-stacking" ? "ml-1" : "";
  const showValue = isActive || row.value > 0;
  const showTrailingStatus = !isActive && row.value === 0;

  return (
    <Pressable
      onPress={onPress}
      testID={`earn-rewards-row-${row.id}`}
      accessibilityRole="button"
      accessibilityLabel={row.label}
      className="flex-row items-center justify-between rounded-[14px] bg-surface-primary px-3.5 py-3 active:opacity-80"
    >
      <View className="flex-1 flex-row items-center gap-2 pr-2">
        <View style={{ opacity: isActive ? 1 : 0.6 }}>
          {row.id === "bridge-game" ? (
            <View className="w-7 shrink-0 items-start">
              <BridgeGameSkinIcon />
            </View>
          ) : (
            <EarnProgramIcon
              program={
                row.id === "dual-stacking" ? "dual-stacking" : "stacking"
              }
              size="sm"
            />
          )}
        </View>
        <View className={`flex-1 ${titleInsetClassName}`}>
          <View className="flex-row items-baseline gap-1.5">
            <Text
              className="shrink font-matter text-base"
              numberOfLines={1}
              style={{ color: titleColor }}
            >
              {row.label}
            </Text>
            {isActive ? (
              <Text
                className="font-instrument-sans-medium text-xs"
                numberOfLines={1}
                style={{
                  color:
                    row.statusTone === "active"
                      ? colors.success[600]
                      : mutedColor,
                }}
              >
                {row.statusLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {showValue ? (
        <Text className="font-instrument-sans-medium text-sm text-primary">
          {maskValue(valueDisplay, isBalanceVisible)}
        </Text>
      ) : showTrailingStatus ? (
        <Text
          className="font-instrument-sans-medium text-xs"
          numberOfLines={1}
          style={{ color: mutedColor }}
        >
          {row.statusLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function EarnRewardsList({
  rewardRows,
  isLoading,
  isBalanceVisible,
  onPressRewardRow,
}: EarnRewardsListProps) {
  if (isLoading) {
    return <RewardsLoadingSkeleton />;
  }

  return (
    <View className="gap-3">
      <Text className="font-instrument-sans-semibold text-xs uppercase tracking-widest text-secondary">
        Opportunities
      </Text>
      {rewardRows.map((row) => (
        <RewardRow
          key={row.id}
          row={row}
          isBalanceVisible={isBalanceVisible}
          onPress={() => onPressRewardRow(row)}
        />
      ))}
    </View>
  );
}
