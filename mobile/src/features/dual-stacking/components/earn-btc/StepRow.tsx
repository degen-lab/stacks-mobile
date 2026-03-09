import React from "react";
import { Pressable, View } from "react-native";
import { Button, Text } from "@/components/ui";
import ArrowRightEmoji from "@/components/ui/icons/arrow-right-emoji";
import colors from "@/components/ui/colors";
import { StepIndicator } from "./StepIndicator";
import { CtaVariant, Step, StepStatus } from "./model";

const CARD_STYLE: Record<StepStatus, string> = {
  current: "border-border-primary bg-sand-100",
  completed: "border-border-secondary bg-sand-100",
  pending: "border-border-secondary bg-sand-100",
  locked: "border-border-secondary bg-sand-100 opacity-70",
};

const CTA_VARIANT_MAP: Record<
  CtaVariant,
  React.ComponentProps<typeof Button>["variant"]
> = {
  primary: "secondaryNavbar",
  orange: "primaryNavbar",
  secondary: "secondaryNavbar",
  disabled: "default",
};

const CTA_BUTTON_TEXT_COLOR: Record<CtaVariant, string> = {
  primary: "text-white",
  orange: "text-primary",
  secondary: "text-sand-100",
  disabled: "text-neutral-600",
};

const CTA_TEXT_COLOR: Record<CtaVariant, { title: string; desc: string }> = {
  primary: { title: "text-primary", desc: "text-secondary" },
  orange: { title: "text-primary", desc: "text-secondary" },
  secondary: { title: "text-secondary", desc: "text-tertiary" },
  disabled: { title: "text-secondary", desc: "text-tertiary" },
};

const LINK_ARROW_COLOR = "#0C0C0D";

export default function StepRow({
  step,
  onPress,
}: {
  step: Step;
  onPress: () => void;
}) {
  const cta = step.cta;
  const isButton = cta.kind === "button";
  const variant = isButton
    ? cta.variant
    : step.status === "completed"
      ? "secondary"
      : "primary";

  const isBoostStep = step.id === 3 || step.id === 4;
  const textStyle = isBoostStep
    ? CTA_TEXT_COLOR.secondary
    : CTA_TEXT_COLOR[variant];
  const isDisabled = isButton && cta.variant === "disabled";

  return (
    <View
      className={`relative flex-row items-start gap-4 rounded-xl p-4 ${CARD_STYLE[step.status]}`}
    >
      {step.showNextBadge && <StepBadge isRecommended={isBoostStep} />}
      <StepIndicator step={step} />

      <View className="flex-1 gap-3">
        <View>
          <Text
            className={`font-instrument-sans-medium text-base ${textStyle.title}`}
          >
            {step.title}
          </Text>
          <Text
            className={`font-instrument-sans-medium text-xs leading-4 mt-0.5 ${textStyle.desc}`}
          >
            {step.description}
          </Text>
        </View>

        {isButton ? (
          <Button
            variant={CTA_VARIANT_MAP[cta.variant]}
            size="sm"
            disabled={isDisabled}
            onPress={isDisabled ? undefined : onPress}
            fullWidth={false}
            className="self-start"
          >
            <View className="flex-row items-center gap-1">
              <Text
                className={`font-instrument-sans-medium text-xs ${CTA_BUTTON_TEXT_COLOR[cta.variant]}`}
              >
                {cta.text}
              </Text>
              {cta.hasArrow && (
                <ArrowRightEmoji
                  width={7}
                  height={7}
                  color={
                    cta.variant === "orange"
                      ? colors.neutral[900]
                      : colors.neutral[200]
                  }
                />
              )}
            </View>
          </Button>
        ) : (
          <Pressable onPress={onPress} className="self-start">
            <View className="flex-row items-center gap-1 border-b border-sand-300 pb-0.5">
              <Text className="font-instrument-sans text-xs text-primary">
                {cta.text}
              </Text>
              {cta.hasArrow ? (
                <ArrowRightEmoji
                  width={7}
                  height={7}
                  color={LINK_ARROW_COLOR}
                />
              ) : null}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function StepBadge({ isRecommended }: { isRecommended: boolean }) {
  return (
    <View
      style={{
        position: "absolute",
        left: -20,
        top: "26%",
        transform: [{ translateY: -12 }],
        shadowColor: "rgba(117, 172, 243, 1)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 6.5,
        elevation: 8,
      }}
      className="bg-feedback-blue-200 border border-feedback-blue-100 rounded-full px-1.5 py-1"
    >
      <Text
        style={{ fontSize: 8, lineHeight: 8, letterSpacing: 0.3 }}
        className="font-mono text-feedback-blue-900 uppercase"
      >
        {isRecommended ? "Recommended" : "Next Step"}
      </Text>
    </View>
  );
}
