import React from "react";
import type { PressableProps, View } from "react-native";
import {
  ActivityIndicator,
  Pressable,
  View as RNView,
  Text,
} from "react-native";
import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

const button = tv({
  slots: {
    container: "my-2 flex flex-row items-center justify-center rounded-md px-4",
    label: "font-matter text-base",
    indicator: "h-6 text-white",
  },

  variants: {
    variant: {
      default: {
        container: "bg-black dark:bg-white",
        label: "text-white dark:text-black",
        indicator: "text-white dark:text-black",
      },
      secondary: {
        container: "bg-primary-600",
        label: "text-secondary-600",
        indicator: "text-white",
      },
      outline: {
        container:
          "bg-sand-100 border border-sand-300 rounded-full active:bg-sand-200",
        label: "text-primary",
        indicator: "text-primary",
      },
      destructive: {
        container: "bg-red-600",
        label: "text-white",
        indicator: "text-white",
      },
      ghost: {
        container: "bg-transparent",
        label: "text-black underline dark:text-white",
        indicator: "text-black dark:text-white",
      },
      link: {
        container: "bg-transparent",
        label: "text-primary font-instrument-sans text-xs",
        indicator: "text-secondary",
      },
      primaryNavbar: {
        container:
          "bg-stacks-blood-orange shadow-blood-orange hover:bg-stacks-accent-400",
        label: "text-primary font-instrument-sans",
        indicator: "text-primary",
      },
      secondaryNavbar: {
        container:
          "bg-neutral-sand-500 hover:bg-neutral-sand-600 px-3 py-0 rounded-md flex items-center justify-center",
        label: "text-background text-xs font-instrument-sans",
        indicator: "text-background",
      },
      gamePrimary: {
        container: "my-0 h-auto rounded-xl bg-primary py-3",
        label: "text-white font-semibold font-instrument-sans",
        indicator: "text-white",
      },
      gameOutline: {
        container:
          "my-0 h-auto rounded-xl border border-sand-300 bg-transparent py-3 dark:border-neutral-700",
        label:
          "text-primary dark:text-white font-semibold font-instrument-sans",
        indicator: "text-primary dark:text-white",
      },
    },
    size: {
      default: {
        container: "h-10 px-4",
        label: "text-base",
      },
      lg: {
        container: "h-14 px-8",
        label: "text-base",
      },
      sm: {
        container: "h-8 px-3",
        label: "text-sm",
        indicator: "h-2",
      },
      game: {
        container: "h-auto px-4",
        label: "text-base",
      },
      icon: { container: "size-9" },
    },
    disabled: {
      true: {
        container: "bg-neutral-300 dark:bg-neutral-300",
        label: "text-neutral-600 dark:text-neutral-600",
        indicator: "text-neutral-400 dark:text-neutral-400",
      },
    },
    fullWidth: {
      true: {
        container: "",
      },
      false: {
        container: "self-center",
      },
    },
  },
  defaultVariants: {
    variant: "default",
    disabled: false,
    fullWidth: true,
    size: "default",
  },
});

type ButtonVariants = VariantProps<typeof button>;
interface Props extends ButtonVariants, Omit<PressableProps, "disabled"> {
  label?: string;
  leftIcon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

const ButtonComponent = (
  {
    label: text,
    loading = false,
    leftIcon,
    variant = "default",
    disabled = false,
    size = "default",
    className = "",
    testID,
    textClassName = "",
    ...props
  }: Props,
  ref: React.Ref<View>,
) => {
  const styles = React.useMemo(
    () => button({ variant, disabled, size }),
    [variant, disabled, size],
  );

  return (
    <Pressable
      disabled={disabled || loading}
      className={styles.container({ className })}
      {...props}
      ref={ref}
      testID={testID}
    >
      {props.children ? (
        props.children
      ) : (
        <>
          {loading ? (
            <ActivityIndicator
              size="small"
              className={styles.indicator()}
              testID={testID ? `${testID}-activity-indicator` : undefined}
            />
          ) : variant === "link" ? (
            <RNView className="items-center">
              <Text
                testID={testID ? `${testID}-label` : undefined}
                className={styles.label({ className: textClassName })}
              >
                {text}
              </Text>
              <RNView className="h-px w-full bg-secondary mt-1" />
            </RNView>
          ) : (
            <RNView className="flex-row items-center justify-center gap-2">
              {leftIcon}
              <Text
                testID={testID ? `${testID}-label` : undefined}
                className={styles.label({ className: textClassName })}
              >
                {text}
              </Text>
            </RNView>
          )}
        </>
      )}
    </Pressable>
  );
};

export const Button = React.forwardRef<View, Props>(ButtonComponent);
Button.displayName = "Button";
