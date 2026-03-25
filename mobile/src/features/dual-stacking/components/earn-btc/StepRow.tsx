import React from "react";
import { Pressable, View } from "react-native";
import { Button, Text } from "@/components/ui";
import ArrowRightEmoji from "@/components/ui/icons/arrow-right-emoji";
import colors from "@/components/ui/colors";
import { StepIndicator } from "./StepIndicator";
import { CtaVariant, Step, StepStatus } from "./model";

const CARD_STYLE: Record<StepStatus, string> = {
  current: "border-sand-600 bg-sand-100",
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
  leading,
  compact,
  forceTextVariant,
  titleClassName,
  descriptionClassName,
}: {
  step: Step;
  onPress: () => void;
  leading?: React.ReactNode;
  compact?: boolean;
  forceTextVariant?: CtaVariant;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  const cta = step.cta;
  const isButton = cta.kind === "button";
  const variant = isButton
    ? cta.variant
    : step.status === "completed"
      ? "secondary"
      : "primary";

  const isBoostStep = step.id === 3 || step.id === 4;
  const resolvedTextVariant =
    forceTextVariant ?? (isBoostStep ? ("secondary" as const) : variant);
  const textStyle = CTA_TEXT_COLOR[resolvedTextVariant];
  const isDisabled = isButton && cta.variant === "disabled";

  return (
    <View
      className={`relative flex-row items-start rounded-xl ${
        compact ? "gap-3 p-3" : "gap-4 p-4"
      } ${CARD_STYLE[step.status]}`}
    >
      {step.showNextBadge && <StepBadge isRecommended={isBoostStep} />}
      {leading ?? <StepIndicator step={step} />}

      <View className={`flex-1 ${compact ? "gap-1.5" : "gap-3"}`}>
        <View>
          <Text
            className={`font-instrument-sans-medium text-base ${textStyle.title} ${titleClassName ?? ""}`}
          >
            {step.title}
          </Text>
          <Text
            className={`font-instrument-sans-medium text-xs leading-4 ${
              compact ? "mt-0" : "mt-0.5"
            } ${textStyle.desc} ${descriptionClassName ?? ""}`}
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
                className={`font-instrument-sans-medium text-sm ${CTA_BUTTON_TEXT_COLOR[cta.variant]}`}
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
            <View className="flex-row items-center gap-1 border-b-2 border-sand-300 pb-0.5">
              <Text className="font-instrument-sans text-sm text-primary">
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
