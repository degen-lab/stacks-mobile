import * as React from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { ChevronsUpDown, Loader } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Text, View, colors } from "@/components/ui";
import { ClockCountdown } from "@/components/ui/icons/clock-countdown";
import { LinkUnderline } from "@/components/ui/link-underline";
import { StatusCircleIcon } from "@/components/ui/status-circle-icon";
import { StepNumberCircleIcon } from "@/components/ui/step-number-circle-icon";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";

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
  const { colorScheme } = useColorScheme();
  const terminalColor =
    colorScheme === "dark" ? colors.charcoal[400] : colors.neutral[400];

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
        <Loader size={18} color={terminalColor} />
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
  const { colorScheme } = useColorScheme();
  const timingText = item.showTiming
    ? formatBridgeProgressTiming(item.step.timing, elapsedMs)
    : null;
  const connectorColor =
    colorScheme === "dark"
      ? resolveThemeTokenColor("dark", "--color-border-primary")
      : colors.neutral[200];

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
              backgroundColor: connectorColor,
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
  const { colorScheme } = useColorScheme();
  const connectorColor =
    colorScheme === "dark"
      ? resolveThemeTokenColor("dark", "--color-border-primary")
      : colors.neutral[200];
  const buttonBorderColor =
    colorScheme === "dark"
      ? resolveThemeTokenColor("dark", "--color-border-primary")
      : colors.neutral[300];
  const buttonBackgroundColor =
    colorScheme === "dark"
      ? resolveThemeTokenColor("dark", "--color-surface-secondary")
      : colors.neutral[50];
  const toggleIconColor =
    colorScheme === "dark" ? colors.charcoal[300] : colors.neutral[500];

  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ width: ICON_SIZE, alignItems: "center" }}>
        <View
          style={{ width: 1, height: 10, backgroundColor: connectorColor }}
        />
        <Pressable
          testID="bridge-progress-toggle"
          onPress={onToggle}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: buttonBorderColor,
            backgroundColor: buttonBackgroundColor,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? "Collapse progress steps" : "Expand progress steps"
          }
        >
          <ChevronsUpDown size={12} color={toggleIconColor} />
        </Pressable>
        {showConnector ? (
          <View
            style={{
              width: 1,
              height: 10,
              backgroundColor: connectorColor,
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
  const { colorScheme } = useColorScheme();
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
  const headerIconColor =
    colorScheme === "dark" ? colors.charcoal[300] : colors.neutral[600];

  return (
    <View className="rounded-[20px] border border-border-secondary bg-sand-100 px-4 py-5 dark:border-border-primary dark:bg-surface-primary">
      <View className="mb-5 flex-row items-center gap-2">
        <ClockCountdown size={20} color={headerIconColor} />
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
