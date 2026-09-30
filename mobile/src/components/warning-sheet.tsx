import { Button, Modal, Text, colors } from "@/components/ui";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";

type WarningSheetVariant = "default" | "danger";

type WarningSheetProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: WarningSheetVariant;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
};

export const WarningSheet = React.forwardRef<
  BottomSheetModal,
  WarningSheetProps
>(
  (
    {
      title,
      description,
      confirmLabel = "Continue",
      cancelLabel = "Cancel",
      variant = "default",
      loading = false,
      error,
      onConfirm,
      onCancel,
      onDismiss,
    }: WarningSheetProps,
    ref: React.ForwardedRef<BottomSheetModal>,
  ) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const sheetBackgroundColor = isDark ? undefined : colors.white;

    return (
      <Modal
        ref={ref}
        title={title}
        enableDynamicSizing={true}
        backgroundStyle={
          sheetBackgroundColor
            ? {
                backgroundColor: sheetBackgroundColor,
              }
            : undefined
        }
        handleBackgroundColor={sheetBackgroundColor}
        onDismiss={onDismiss}
      >
        <BottomSheetScrollView contentContainerClassName="px-5 pb-6">
          <Text className="text-base font-instrument-sans text-secondary dark:text-neutral-300">
            {description}
          </Text>
          {error ? (
            <Text className="mt-4 text-sm font-instrument-sans text-red-400">
              {error}
            </Text>
          ) : null}
          <View className="mt-12 space-y-3">
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              size="lg"
              variant={variant === "danger" ? "destructive" : "default"}
            />
            <Button
              label={cancelLabel}
              variant="ghost"
              size="lg"
              onPress={() => {
                onCancel?.();
              }}
            />
          </View>
        </BottomSheetScrollView>
      </Modal>
    );
  },
);

WarningSheet.displayName = "WarningSheet";
