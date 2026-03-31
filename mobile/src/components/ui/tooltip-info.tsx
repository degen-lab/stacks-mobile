import * as React from "react";
import {
  Modal,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import { Info } from "lucide-react-native";

import { Text } from "@/components/ui/text";

type Size = "sm" | "md" | "lg";

type Props = {
  content: React.ReactNode;
  ariaLabel?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  size?: Size;
  "data-testid"?: string;
  className?: string;
};

type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ContentSize = {
  width: number;
  height: number;
};

const TOOLTIP_MAX_WIDTH = 260;
const TOOLTIP_GAP = 10;
const TOOLTIP_MARGIN = 16;
const CARET_SIZE = 10;

const sizeClasses = {
  sm: "p-1 [&_svg]:size-3.5",
  md: "p-1.5 [&_svg]:size-4",
  lg: "p-2 [&_svg]:size-5",
} as const;

const tooltipClasses = {
  content: "bg-sand-900 shadow-elevation-light-m",
  text: "text-sand-100",
  iconColor: "#95918C",
  buttonShape: "",
} as const;

const baseClasses = [
  "items-center justify-center rounded-full active:opacity-70",
  Platform.OS === "web"
    ? "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30 focus-visible:ring-offset-2"
    : "",
]
  .filter(Boolean)
  .join(" ");

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function InfoTooltipIcon({
  content,
  ariaLabel = "More information",
  size = "md",
  side,
  align = "center",
  className,
  "data-testid": testId,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState<AnchorRect | null>(null);
  const [contentSize, setContentSize] = React.useState<ContentSize | null>(
    null,
  );
  const triggerRef = React.useRef<View>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTextLikeContent =
    typeof content === "string" ||
    typeof content === "number" ||
    (React.isValidElement(content) && content.type === React.Fragment);

  const measureTrigger = React.useCallback(() => {
    requestAnimationFrame(() => {
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        if (!width || !height) return;

        setAnchor({ x, y, width, height });
      });
    });
  }, []);

  const openTooltip = React.useCallback(() => {
    measureTrigger();
    setOpen(true);
  }, [measureTrigger]);

  const close = React.useCallback(() => {
    setOpen(false);
    setContentSize(null);
  }, []);

  const toggleOpen = React.useCallback(() => {
    if (open) {
      close();
      return;
    }

    openTooltip();
  }, [close, open, openTooltip]);

  React.useEffect(() => {
    if (!open) return;
    measureTrigger();
  }, [measureTrigger, open, windowHeight, windowWidth]);

  const tooltipPosition = React.useMemo(() => {
    if (!anchor || !contentSize) return null;

    const maxLeft = Math.max(
      TOOLTIP_MARGIN,
      windowWidth - contentSize.width - TOOLTIP_MARGIN,
    );

    const preferredHorizontal = (() => {
      if (side === "left") {
        return anchor.x - contentSize.width - TOOLTIP_GAP;
      }

      if (side === "right") {
        return anchor.x + anchor.width + TOOLTIP_GAP;
      }

      if (align === "start") {
        return anchor.x;
      }

      if (align === "end") {
        return anchor.x + anchor.width - contentSize.width;
      }

      return anchor.x + anchor.width / 2 - contentSize.width / 2;
    })();

    const left = clamp(preferredHorizontal, TOOLTIP_MARGIN, maxLeft);

    const fitsBelow =
      anchor.y + anchor.height + TOOLTIP_GAP + contentSize.height <=
      windowHeight - TOOLTIP_MARGIN;
    const fitsAbove =
      anchor.y - TOOLTIP_GAP - contentSize.height >= TOOLTIP_MARGIN;
    const availableAbove = anchor.y - TOOLTIP_MARGIN;
    const availableBelow =
      windowHeight - (anchor.y + anchor.height) - TOOLTIP_MARGIN;
    const showAbove =
      side === "top"
        ? true
        : side === "bottom"
          ? false
          : fitsAbove || (!fitsBelow && availableAbove >= availableBelow);

    const top =
      side === "left" || side === "right"
        ? clamp(
            anchor.y + anchor.height / 2 - contentSize.height / 2,
            TOOLTIP_MARGIN,
            windowHeight - contentSize.height - TOOLTIP_MARGIN,
          )
        : showAbove
          ? anchor.y - contentSize.height - TOOLTIP_GAP
          : anchor.y + anchor.height + TOOLTIP_GAP;

    const caretLeft = clamp(
      anchor.x + anchor.width / 2 - left - CARET_SIZE / 2,
      12,
      Math.max(12, contentSize.width - CARET_SIZE - 12),
    );

    const caretTop = clamp(
      anchor.y + anchor.height / 2 - top - CARET_SIZE / 2,
      12,
      Math.max(12, contentSize.height - CARET_SIZE - 12),
    );

    return {
      left,
      top,
      showAbove,
      caretLeft,
      caretTop,
      showHorizontalCaret: side === "left" || side === "right",
      showLeftCaret: side === "right",
      showRightCaret: side === "left",
    };
  }, [align, anchor, contentSize, side, windowHeight, windowWidth]);

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={toggleOpen}
          accessibilityRole="button"
          accessibilityLabel={ariaLabel}
          testID={testId}
          hitSlop={8}
          className={`${baseClasses} ${sizeClasses[size]} ${tooltipClasses.buttonShape} ${className ?? ""}`}
        >
          <Info size={14} color={tooltipClasses.iconColor} />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={open}
        onRequestClose={close}
        statusBarTranslucent
        animationType="fade"
      >
        <View className="flex-1" pointerEvents="box-none">
          <Pressable
            className="absolute inset-0"
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close tooltip"
          />

          <View
            pointerEvents="box-none"
            className="absolute inset-0"
            style={{ opacity: tooltipPosition ? 1 : 0 }}
          >
            <View
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                if (
                  width !== contentSize?.width ||
                  height !== contentSize?.height
                ) {
                  setContentSize({ width, height });
                }
              }}
              className={`absolute rounded-xl px-4 py-3 ${tooltipClasses.content}`}
              style={{
                left: tooltipPosition?.left ?? TOOLTIP_MARGIN,
                top: tooltipPosition?.top ?? TOOLTIP_MARGIN,
                maxWidth: TOOLTIP_MAX_WIDTH,
              }}
            >
              {tooltipPosition ? (
                <View
                  pointerEvents="none"
                  className="absolute rotate-45 bg-sand-900"
                  style={{
                    width: CARET_SIZE,
                    height: CARET_SIZE,
                    left: tooltipPosition.showHorizontalCaret
                      ? tooltipPosition.showLeftCaret
                        ? -CARET_SIZE / 2
                        : undefined
                      : tooltipPosition.caretLeft,
                    right: tooltipPosition.showHorizontalCaret
                      ? tooltipPosition.showRightCaret
                        ? -CARET_SIZE / 2
                        : undefined
                      : undefined,
                    top: tooltipPosition.showHorizontalCaret
                      ? tooltipPosition.caretTop
                      : tooltipPosition.showAbove
                        ? undefined
                        : -CARET_SIZE / 2,
                    bottom:
                      !tooltipPosition.showHorizontalCaret &&
                      tooltipPosition.showAbove
                        ? -CARET_SIZE / 2
                        : undefined,
                  }}
                />
              ) : null}

              <Pressable
                onPress={(e) => e.stopPropagation()}
                accessibilityRole="text"
              >
                {isTextLikeContent ? (
                  <Text
                    className={`font-instrument-sans text-xs font-medium leading-5 ${tooltipClasses.text}`}
                  >
                    {content}
                  </Text>
                ) : (
                  content
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
