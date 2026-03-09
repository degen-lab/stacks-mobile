import React from "react";
import { View } from "react-native";
import { StepRowSkeleton } from "./StepRow.skeleton";

export function EarnBtcSkeleton({
  isEnrolledNextCycle = false,
}: {
  isEnrolledNextCycle?: boolean;
}) {
  return (
    <View className="bg-surface-primary rounded-xl px-3 py-5">
      <View className="gap-3">
        <StepRowSkeleton />
        <StepRowSkeleton />
        <StepRowSkeleton />
        {!isEnrolledNextCycle && <StepRowSkeleton />}
      </View>
    </View>
  );
}
