import React from "react";
import { View } from "react-native";
import { ArrowRight, Check } from "lucide-react-native";
import { DashedCircle } from "@/components/ui/icons/dashed-circle";
import colors from "@/components/ui/colors";
import { Step } from "./model";

export function StepIndicator({ step }: { step: Step }) {
  if (step.showNextBadge) return <View className="w-8 h-8 shrink-0" />;

  if (step.status === "locked") {
    return (
      <DashedCircle
        size={32}
        strokeColor={colors.neutral[300]}
        dashArray="2 4"
      />
    );
  }

  if (step.status === "completed") {
    const circleBg = step.id === 1 ? "bg-bitcoin-200" : "bg-feedback-green-150";
    const iconColor = step.id === 1 ? "#e17c18" : "#22C55E";
    return (
      <View className="w-8 h-8 shrink-0 items-center justify-center rounded-full bg-sand-200">
        <View
          className={`w-8 h-8 items-center justify-center rounded-full ${circleBg}`}
        >
          <Check size={16} color={iconColor} strokeWidth={1.8} />
        </View>
      </View>
    );
  }

  const isPrimary = step.status === "current";
  return (
    <View
      className={`w-8 h-8 shrink-0 items-center justify-center rounded-full ${
        isPrimary ? "border border-stacks-blood-orange" : "bg-sand-200"
      }`}
    >
      <ArrowRight
        size={16}
        color={isPrimary ? colors.stacks.bloodOrange : colors.neutral[500]}
        strokeWidth={2}
        pointerEvents="none"
      />
    </View>
  );
}
