import * as React from "react";
import {
  Linking,
  Modal,
  Pressable,
  View as RNView,
  useWindowDimensions,
} from "react-native";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { ArrowUpRight, Info } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Text, View, colors } from "@/components/ui";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";
import type { BridgeChipTone } from "../utils/status";

export type BridgeChip = {
  label: string;
  value: string;
  tooltip?: string;
  href?: string;
  accessibilityLabel?: string;
  tone?: BridgeChipTone;
};

const TOOLTIP_MAX_WIDTH = 240;
const TOOLTIP_GAP = 8;
const TOOLTIP_MARGIN = 16;
const CARET_SIZE = 10;

const CHIP_TONE_STYLES: Record<
  BridgeChipTone,
  {
    valueColor: string;
  }
> = {
  neutral: {
    valueColor: colors.secondary,
  },
  success: {
    valueColor: colors.success[700],
  },
  warning: {
    valueColor: colors.stacks.bloodOrange,
  },
  danger: {
    valueColor: colors.danger[700],
  },
  info: {
    valueColor: "#0284C7",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ChipContent({
  item,
  withInfo,
  withExternalLink,
}: {
  item: BridgeChip;
  withInfo?: boolean;
  withExternalLink?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const toneStyles = CHIP_TONE_STYLES[item.tone ?? "neutral"];
  const neutralValueColor =
    colorScheme === "dark"
      ? resolveThemeTokenColor("dark", "--color-text-secondary")
      : colors.secondary;
  const metaIconColor =
    colorScheme === "dark" ? colors.charcoal[400] : colors.neutral[500];
  const valueColor =
    (item.tone ?? "neutral") === "neutral"
      ? neutralValueColor
      : toneStyles.valueColor;

  return (
    <View className="flex-row items-center gap-1.5 rounded-lg border border-border-secondary bg-sand-100 px-3 py-2 dark:border-border-primary dark:bg-surface-primary">
      <Text className="font-instrument-sans text-xs text-sand-500 dark:text-secondary">
        {item.label}:
      </Text>
      {withInfo && <Info size={10} color={metaIconColor} />}
      <Text
        className="font-instrument-sans-medium text-xs"
        style={{ color: valueColor }}
      >
        {item.value}
      </Text>
      {withExternalLink ? (
        <ArrowUpRight size={10} color={metaIconColor} />
      ) : null}
    </View>
  );
}

async function openExternalHref(href: string) {
  if (process.env.EXPO_OS !== "web") {
    await openBrowserAsync(href, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
    return;
  }

  await Linking.openURL(href);
}

function LinkChip({ item }: { item: BridgeChip & { href: string } }) {
  return (
    <Pressable
      onPress={() => {
        void openExternalHref(item.href);
      }}
      accessibilityRole="link"
      accessibilityLabel={item.accessibilityLabel ?? `Open ${item.label}`}
      className="active:opacity-70"
    >
      <ChipContent item={item} withExternalLink />
    </Pressable>
  );
}

function TooltipChip({ item }: { item: BridgeChip & { tooltip: string } }) {
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [contentSize, setContentSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);
  const triggerRef = React.useRef<RNView>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const measure = React.useCallback(() => {
    requestAnimationFrame(() => {
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        if (!width || !height) return;
        setAnchor({ x, y, width, height });
      });
    });
  }, []);

  const openTooltip = React.useCallback(() => {
    measure();
    setOpen(true);
  }, [measure]);

  const close = React.useCallback(() => {
    setOpen(false);
    setContentSize(null);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    measure();
  }, [measure, open, windowHeight, windowWidth]);

  const pos = React.useMemo(() => {
    if (!anchor || !contentSize) return null;
    const maxLeft = Math.max(
      TOOLTIP_MARGIN,
      windowWidth - contentSize.width - TOOLTIP_MARGIN,
    );
    const left = clamp(
      anchor.x + anchor.width / 2 - contentSize.width / 2,
      TOOLTIP_MARGIN,
      maxLeft,
    );
    const fitsBelow =
      anchor.y + anchor.height + TOOLTIP_GAP + contentSize.height <=
      windowHeight - TOOLTIP_MARGIN;
    const fitsAbove =
      anchor.y - TOOLTIP_GAP - contentSize.height >= TOOLTIP_MARGIN;
    const showAbove = fitsAbove || !fitsBelow;
    const top = showAbove
      ? anchor.y - contentSize.height - TOOLTIP_GAP
      : anchor.y + anchor.height + TOOLTIP_GAP;
    const caretLeft = clamp(
      anchor.x + anchor.width / 2 - left - CARET_SIZE / 2,
      12,
      Math.max(12, contentSize.width - CARET_SIZE - 12),
    );
    return { left, top, showAbove, caretLeft };
  }, [anchor, contentSize, windowHeight, windowWidth]);

  return (
    <>
      <RNView ref={triggerRef} collapsable={false}>
        <Pressable onPress={openTooltip} accessibilityRole="button">
          <ChipContent item={item} withInfo />
        </Pressable>
      </RNView>

      <Modal
        transparent
        visible={open}
        onRequestClose={close}
        statusBarTranslucent
        animationType="fade"
      >
        <View className="flex-1" pointerEvents="box-none">
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <View
            pointerEvents="box-none"
            className="absolute inset-0"
            style={{ opacity: pos ? 1 : 0 }}
          >
            <View
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (
                  width !== contentSize?.width ||
                  height !== contentSize?.height
                ) {
                  setContentSize({ width, height });
                }
              }}
              className="absolute rounded-xl bg-sand-900 px-4 py-3 shadow-elevation-light-m"
              style={{
                left: pos?.left ?? TOOLTIP_MARGIN,
                top: pos?.top ?? TOOLTIP_MARGIN,
                maxWidth: TOOLTIP_MAX_WIDTH,
              }}
            >
              {pos ? (
                <View
                  pointerEvents="none"
                  className="absolute rotate-45 bg-sand-900"
                  style={{
                    width: CARET_SIZE,
                    height: CARET_SIZE,
                    left: pos.caretLeft,
                    top: pos.showAbove ? undefined : -CARET_SIZE / 2,
                    bottom: pos.showAbove ? -CARET_SIZE / 2 : undefined,
                  }}
                />
              ) : null}
              <Pressable
                onPress={(e) => e.stopPropagation()}
                accessibilityRole="text"
              >
                <Text className="font-instrument-sans text-xs font-medium leading-5 text-sand-100">
                  {item.tooltip}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function BridgeChipList({ items }: { items: BridgeChip[] }) {
  return (
    <View className="flex-row flex-wrap justify-center gap-2">
      {items.map((item) =>
        item.tooltip ? (
          <TooltipChip
            key={item.label}
            item={item as BridgeChip & { tooltip: string }}
          />
        ) : item.href ? (
          <LinkChip
            key={item.label}
            item={item as BridgeChip & { href: string }}
          />
        ) : (
          <ChipContent key={item.label} item={item} />
        ),
      )}
    </View>
  );
}
