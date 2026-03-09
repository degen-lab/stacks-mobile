import * as React from "react";
import { Linking, Pressable, View } from "react-native";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { ArrowRight, ArrowUpRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";

type Direction = "up-right" | "right";
type Variant =
  | "default"
  | "footerDashboard"
  | "footerLanding"
  | "cardDescription";
type Size = "xs" | "sm";

type Props = {
  href?: string;
  children: React.ReactNode;
  direction?: Direction;
  variant?: Variant;
  size?: Size;
  className?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const variantClasses = {
  default: {
    text: "text-primary",
    underline: "bg-border-secondary",
    iconColor: "#95918C",
  },
  footerDashboard: {
    text: "text-secondary",
    underline: "bg-border-secondary",
    iconColor: "#95918C",
  },
  footerLanding: {
    text: "text-sand-100",
    underline: "bg-border-secondary",
    iconColor: "#95918C",
  },
  cardDescription: {
    text: "text-primary",
    underline: "bg-border-secondary",
    iconColor: "#95918C",
  },
} as const;

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
} as const;

export function LinkUnderline({
  href,
  children,
  direction = "up-right",
  variant = "default",
  size = "sm",
  className = "",
  onPress,
  accessibilityLabel,
}: Props) {
  const styles = variantClasses[variant];

  const handlePress = React.useCallback(async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!href) return;

    if (process.env.EXPO_OS !== "web") {
      await openBrowserAsync(href, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
      return;
    }

    await Linking.openURL(href);
  }, [href, onPress]);

  const icon =
    direction === "right" ? (
      <ArrowRight size={12} color={styles.iconColor} />
    ) : (
      <ArrowUpRight size={12} color={styles.iconColor} />
    );

  return (
    <Pressable
      onPress={() => {
        void handlePress();
      }}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      className={`self-start active:opacity-70 ${className}`}
    >
      <View className="items-start">
        <View className="flex-row items-center gap-1.5 pb-0.5">
          <Text
            className={`font-instrument-sans font-medium ${styles.text} ${sizeClasses[size]}`}
          >
            {children}
          </Text>
          {icon}
        </View>
        <View className={`h-px w-full ${styles.underline}`} />
      </View>
    </Pressable>
  );
}
