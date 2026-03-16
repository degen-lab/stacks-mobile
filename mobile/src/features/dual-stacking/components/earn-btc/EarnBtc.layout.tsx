import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui";
import EarnBtcIcon from "@/components/ui/icons/earn-btc-icon";
import BoostYieldIcon from "@/components/ui/icons/boost-yield-icon";
import SectionHeader from "../layout/section-header";
import StepRow from "./StepRow";
import { EarnBtcSkeleton } from "./EarnBtc.skeleton";
import { Step } from "./model";
import { Loadable } from "../cards/shared/loadable";

export type EarnBtcProps = {
  model: {
    steps: Step[];
    enrolled?: boolean;
  };
  onStepAction: (stepId: number) => void;
  isLoading?: boolean;
  isError?: boolean;
};

export function EarnBtcLayout({
  model,
  onStepAction,
  isLoading,
  isError,
}: EarnBtcProps) {
  if (isLoading) {
    return (
      <View>
        <View className="mb-3 flex-row items-center gap-2 px-3">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-6 w-40 rounded-sm" />
        </View>
        <EarnBtcSkeleton />
      </View>
    );
  }

  const title = model.enrolled ? "Boost your rewards" : "Earn BTC in 4 steps";
  const icon = model.enrolled ? <BoostYieldIcon /> : <EarnBtcIcon />;

  return (
    <SectionHeader icon={icon} title={title}>
      <Loadable
        isLoading={false}
        isError={isError}
        fallback={
          <EarnBtcSkeleton isEnrolledNextCycle={Boolean(model.enrolled)} />
        }
      >
        <View className="bg-surface-primary rounded-xl p-3">
          <View className="gap-3">
            {model.steps.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                onPress={() => onStepAction(step.id)}
              />
            ))}
          </View>
        </View>
      </Loadable>
    </SectionHeader>
  );
}
