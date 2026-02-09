import { Progress } from "@/components/ui/progress";
import { Card } from "../shared/card";
import { CardHeader } from "../shared/card-header";
// import { scrollToAndHighlight } from '@/lib/ui/utils';
import { Status } from "@/features/dual-stacking/types/status";
import { View, Text } from "@/components/ui";

export interface APYCardProps {
  apy: number;
  maxApy: number;
  status: Status;
}

function getApyColors(pct: number) {
  if (pct >= 100) {
    // TODO: define variables for hardcoded colors
    // if we will have similar logic in multiple places extract into a shared util
    return {
      textColor: "text-[#30A46C]",
      progressColor: "#30A46C",
    };
  }
  if (pct >= 50) {
    return {
      textColor: "text-[#92A524]",
      progressColor: "#AEC731",
    };
  }
  if (pct >= 1) {
    return {
      textColor: "text-bitcoin-500",
      progressColor: "#F4BF67",
    };
  }
  return { textColor: "text-tertiary", progressColor: "#B7B4B0" };
}

export function APYCard({ apy, maxApy, status }: APYCardProps) {
  const progressPct = maxApy > 0 ? Math.min((apy / maxApy) * 100, 100) : 0;
  const isMaxApy = progressPct >= 100;
  const hasApy = apy > 0;
  const { textColor, progressColor } = getApyColors(progressPct);
  //   const handleBadgeClick = () => {
  //     if (status === Status.NotBoosting) {
  //       scrollToAndHighlight('steps-to-earn-btc', {
  //         padding: 8,
  //       });
  //     }
  //   };
  return (
    <Card>
      <CardHeader
        title="Estimated APY"
        status={status}
        showTooltip={isMaxApy}
        tooltipContent={
          <>
            Estimated APY combines your Dual Stacking rewards from sBTC Stacking
            (up to {maxApy.toFixed(2)}% APY) and your stacked STX.{" "}
          </>
        }
        // onBadgeClick={handleBadgeClick}
      />
      <View className="mt-2.5 gap-3">
        <View className="flex-row items-baseline gap-2">
          <Text className={`font-matter text-2xl ${textColor}`}>
            {apy.toFixed(2)}%
          </Text>
          <Text
            className={`${
              hasApy ? "text-secondary" : "text-tertiary"
            } font-instrument-sans-medium text-sm`}
          >
            / {maxApy?.toFixed(2)}% Max. boost available
          </Text>
        </View>

        <Progress
          value={progressPct}
          className="h-1 w-[90%]"
          indicatorColor={progressColor}
          showThumb={progressPct >= 1}
          thumbColor={progressColor}
        />
      </View>
    </Card>
  );
}
