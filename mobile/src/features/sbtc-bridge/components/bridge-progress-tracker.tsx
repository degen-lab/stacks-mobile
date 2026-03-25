import * as React from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { ChevronsUpDown, Loader } from "lucide-react-native";

import { Text, View, colors } from "@/components/ui";
import { ClockCountdown } from "@/components/ui/icons/clock-countdown";
import { LinkUnderline } from "@/components/ui/link-underline";
import { StatusCircleIcon } from "@/components/ui/status-circle-icon";
import { StepNumberCircleIcon } from "@/components/ui/step-number-circle-icon";

import {
  formatBridgeProgressTiming,
  getBridgeProgressRenderItems,
  type BridgeProgressRenderItem,
} from "./bridge-progress-tracker.utils";
import { BRIDGE_PROGRESS_MINUTE_MS } from "../utils/progress";
import type { BridgeProgressMode, BridgeProgressStep } from "../utils/progress";

const ICON_SIZE = 20;

function ProgressMarker({
  step,
  stepNumber,
  mode,
}: {
  step: BridgeProgressStep;
  stepNumber: number;
  mode: BridgeProgressMode;
}) {
  if (step.state === "complete") {
    return <StatusCircleIcon size={ICON_SIZE} iconSize={14} />;
  }

  if (step.state === "failed") {
    return (
      <View
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
          backgroundColor: colors.danger[600],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text className="font-instrument-sans-medium text-xs text-white">
          !
        </Text>
      </View>
    );
  }

  if (step.state === "active") {
    if (mode === "preview") {
      return <StepNumberCircleIcon value={stepNumber} size={ICON_SIZE} />;
    }

    return (
      <View
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="small" color={colors.stacks.bloodOrange} />
      </View>
    );
  }

  if (step.isTerminal) {
    return (
      <View
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader size={18} color={colors.neutral[400]} />
      </View>
    );
  }

  return <StepNumberCircleIcon value={stepNumber} size={ICON_SIZE} />;
}

function useMinuteNow() {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const intervalId = setInterval(
      () => setNow(Date.now()),
      BRIDGE_PROGRESS_MINUTE_MS,
    );
    return () => clearInterval(intervalId);
  }, []);

  return now;
}

function getStepTitleClassName(step: BridgeProgressStep) {
  if (step.state === "active" || step.state === "failed") {
    return "font-matter text-base text-primary";
  }

  return "font-matter text-base text-secondary";
}

function ProgressStepRow({
  item,
  mode,
  elapsedMs,
}: {
  item: Extract<BridgeProgressRenderItem, { kind: "step" }>;
  mode: BridgeProgressMode;
  elapsedMs: number;
}) {
  const timingText = item.showTiming
    ? formatBridgeProgressTiming(item.step.timing, elapsedMs)
    : null;

  return (
    <View style={{ flexDirection: "row", alignItems: "stretch" }}>
      <View style={{ width: ICON_SIZE, alignItems: "center" }}>
        <ProgressMarker
          step={item.step}
          stepNumber={item.stepNumber}
          mode={mode}
        />
        {item.showConnector ? (
          <View
            style={{
              flex: 1,
              width: 1,
              minHeight: 16,
              marginTop: 4,
              backgroundColor: colors.neutral[200],
            }}
          />
        ) : null}
      </View>

      <View
        style={{
          flex: 1,
          paddingLeft: 12,
          paddingBottom: item.showConnector ? 20 : 0,
        }}
      >
        <Text className={getStepTitleClassName(item.step)}>
          {item.step.title}
        </Text>

        {item.showDescription ? (
          <Text className="mt-1 font-instrument-sans text-xs leading-5 text-secondary">
            {item.step.description}
          </Text>
        ) : null}

        {timingText ? (
          <Text
            testID={`${item.step.id}-timing`}
            className="mt-1 font-instrument-sans-medium text-xs leading-5"
            style={{ color: colors.stacks.bloodOrange }}
          >
            {timingText}
          </Text>
        ) : null}

        {item.showLink && item.step.link ? (
          <View className="mt-2">
            <LinkUnderline
              href={item.step.link.href}
              size="xs"
              variant="footerDashboard"
            >
              {item.step.link.label}
            </LinkUnderline>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CollapseToggle({
  expanded,
  hiddenCount,
  onToggle,
  showConnector,
}: {
  expanded: boolean;
  hiddenCount: number;
  onToggle: () => void;
  showConnector: boolean;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ width: ICON_SIZE, alignItems: "center" }}>
        <View
          style={{ width: 1, height: 10, backgroundColor: colors.neutral[200] }}
        />
        <Pressable
          testID="bridge-progress-toggle"
          onPress={onToggle}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.neutral[300],
            backgroundColor: colors.neutral[50],
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? "Collapse progress steps" : "Expand progress steps"
          }
        >
          <ChevronsUpDown size={12} color={colors.neutral[500]} />
        </Pressable>
        {showConnector ? (
          <View
            style={{
              width: 1,
              height: 10,
              backgroundColor: colors.neutral[200],
            }}
          />
        ) : null}
      </View>

      <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center" }}>
        <Text className="font-instrument-sans text-xs leading-5 text-secondary">
          {expanded
            ? "Collapse"
            : `${hiddenCount} more step${hiddenCount > 1 ? "s" : ""}…`}
        </Text>
      </View>
    </View>
  );
}

export function BridgeProgressTracker({
  steps,
  mode = "detail",
  collapsible = true,
  title = "Progress tracker",
}: {
  steps: BridgeProgressStep[];
  mode?: BridgeProgressMode;
  collapsible?: boolean;
  title?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const now = useMinuteNow();
  const [timingBaseMs, setTimingBaseMs] = React.useState(() => Date.now());
  const effectiveCollapsible = mode === "detail" ? collapsible : false;

  React.useEffect(() => {
    setTimingBaseMs(Date.now());
  }, [steps]);

  const items = React.useMemo(
    () =>
      getBridgeProgressRenderItems({
        steps,
        mode,
        collapsible: effectiveCollapsible,
        expanded,
      }),
    [effectiveCollapsible, expanded, mode, steps],
  );

  if (steps.length === 0) return null;

  const elapsedMs = Math.max(0, now - timingBaseMs);

  return (
    <View className="rounded-[20px] border border-border-secondary bg-sand-100 px-4 py-5">
      <View className="mb-5 flex-row items-center gap-2">
        <ClockCountdown size={20} color={colors.neutral[600]} />
        <Text className="font-matter text-lg text-primary">{title}</Text>
      </View>

      {items.map((item) => {
        if (item.kind === "toggle") {
          return (
            <CollapseToggle
              key="toggle"
              expanded={expanded}
              hiddenCount={item.hiddenCount}
              onToggle={() => setExpanded((current) => !current)}
              showConnector={item.showConnector}
            />
          );
        }

        return (
          <ProgressStepRow
            key={item.step.id}
            item={item}
            mode={mode}
            elapsedMs={elapsedMs}
          />
        );
      })}
    </View>
  );
}
