import * as React from "react";
import { Modal, Pressable } from "react-native";
import { Info } from "lucide-react-native";

import { Text } from "@/components/ui/text";

type Variant = "default" | "yieldTracker";
type Size = "sm" | "md" | "lg";

type Props = {
  content: React.ReactNode;
  ariaLabel?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  variant?: Variant;
  size?: Size;
  "data-testid"?: string;
  className?: string;
};

const sizeClasses = {
  sm: "p-1 [&_svg]:size-3.5",
  md: "p-1.5 [&_svg]:size-4",
  lg: "p-2 [&_svg]:size-5",
} as const;

const variantClasses = {
  default: {
    content:
      "bg-neutral-sand-600 text-neutral-sand-50 shadow-elevation-dark-sm",
    icon: "text-icon-tertiary",
    buttonShape: "",
  },
  yieldTracker: {
    content:
      "bg-neutral-sand-600 text-neutral-sand-50 shadow-elevation-dark-sm",
    icon: "text-white",
    buttonShape: "rounded-full bg-surface-primary",
  },
} as const;

const baseClasses =
  "grid place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30 focus-visible:ring-offset-2";

export function InfoTooltipIcon({
  content,
  ariaLabel = "More information",
  variant = "default",
  size = "md",
  className,
  "data-testid": testId,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const styles = variantClasses[variant];

  const toggleOpen = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityLabel={ariaLabel}
        testID={testId}
        className={`${baseClasses} ${sizeClasses[size]} ${styles.icon} ${styles.buttonShape} ${className ?? ""}`}
      >
        <Info size={14} className="text-sand-500" />
      </Pressable>

      <Modal
        transparent
        visible={open}
        onRequestClose={close}
        statusBarTranslucent
        animationType="fade"
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close tooltip"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={`rounded-lg px-4 py-3 max-w-sm ${styles.content}`}
            accessibilityRole="text"
          >
            {typeof content === "string" ? (
              <Text className="font-instrument-sans text-xs font-medium text-neutral-sand-50">
                {content}
              </Text>
            ) : (
              content
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
