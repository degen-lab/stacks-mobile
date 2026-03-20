import { BRIDGE_PROGRESS_MINUTE_MS } from "../utils/progress";
import type {
  BridgeProgressMode,
  BridgeProgressStep,
  BridgeProgressStepTiming,
} from "../utils/progress";

export type BridgeProgressRenderItem =
  | {
      kind: "step";
      step: BridgeProgressStep;
      stepNumber: number;
      showDescription: boolean;
      showTiming: boolean;
      showLink: boolean;
      showConnector: boolean;
    }
  | {
      kind: "toggle";
      hiddenCount: number;
      showConnector: boolean;
    };

function shouldShowDescription(
  step: BridgeProgressStep,
  mode: BridgeProgressMode,
) {
  if (!step.description) return false;
  if (mode === "preview") return true;
  return step.state !== "complete" || Boolean(step.isTerminal);
}

function createStepRenderItem(
  step: BridgeProgressStep,
  stepNumber: number,
  mode: BridgeProgressMode,
): Omit<Extract<BridgeProgressRenderItem, { kind: "step" }>, "showConnector"> {
  return {
    kind: "step",
    step,
    stepNumber,
    showDescription: shouldShowDescription(step, mode),
    showTiming: step.state === "active" && Boolean(step.timing),
    showLink: Boolean(step.link),
  };
}

export function getBridgeProgressRenderItems({
  steps,
  mode,
  collapsible,
  expanded,
}: {
  steps: BridgeProgressStep[];
  mode: BridgeProgressMode;
  collapsible: boolean;
  expanded: boolean;
}): BridgeProgressRenderItem[] {
  if (steps.length === 0) return [];

  const stepItems = steps.map((step, index) =>
    createStepRenderItem(step, index + 1, mode),
  );

  const renderItems: BridgeProgressRenderItem[] = [];

  if (mode === "preview" || !collapsible) {
    renderItems.push(...stepItems);
  } else {
    const focusIndex = steps.findIndex(
      (step) => step.state === "active" || step.state === "failed",
    );

    if (focusIndex < 0) {
      renderItems.push(...stepItems);
    } else {
      const tailIndex =
        steps[steps.length - 1]?.isTerminal === true ? steps.length - 1 : -1;
      const hasTail = tailIndex > focusIndex;
      const head = stepItems.slice(0, focusIndex + 1);
      const middle = hasTail
        ? stepItems.slice(focusIndex + 1, tailIndex)
        : stepItems.slice(focusIndex + 1);

      renderItems.push(...head);

      if (middle.length > 0) {
        renderItems.push({
          kind: "toggle",
          hiddenCount: middle.length,
          showConnector: false,
        });

        if (expanded) {
          renderItems.push(...middle);
        }
      }

      if (hasTail) {
        renderItems.push(stepItems[tailIndex]);
      } else if (middle.length === 0) {
        renderItems.push(...stepItems.slice(focusIndex + 1));
      }
    }
  }

  return renderItems.map((item, index) => ({
    ...item,
    showConnector: index < renderItems.length - 1,
  }));
}

function formatCountdownMinutes(remainingMs: number) {
  const minutes = Math.ceil(remainingMs / BRIDGE_PROGRESS_MINUTE_MS);
  if (minutes <= 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatBridgeProgressTiming(
  timing: BridgeProgressStepTiming | undefined,
  elapsedMs: number = 0,
) {
  if (!timing) return null;

  if (timing.kind === "estimate") {
    return timing.text;
  }

  const remainingMs = Math.max(0, timing.remainingMs - elapsedMs);
  return `Estimated time left: ~${formatCountdownMinutes(remainingMs)}`;
}
