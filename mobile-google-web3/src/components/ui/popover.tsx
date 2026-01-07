import React from "react";
import type { ModalProps } from "react-native";
import { Modal, Pressable, View } from "react-native";
import { twMerge } from "tailwind-merge";

type PopoverProps = {
  visible: boolean;
  onClose: () => void;
  contentClassName?: string;
  children: React.ReactNode;
} & Pick<ModalProps, "animationType">;

export function Popover({
  visible,
  onClose,
  contentClassName = "",
  animationType = "fade",
  children,
}: PopoverProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType={animationType}
      statusBarTranslucent
    >
      <View className="absolute inset-0" pointerEvents="box-none">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close popover backdrop"
        >
          <View className="flex-1 bg-black/50 backdrop-blur-[2px]" />
        </Pressable>

        <View
          pointerEvents="box-none"
          className="absolute inset-0 items-center justify-center px-6"
        >
          <View
            className={twMerge(
              "w-full max-w-[440px] rounded-3xl bg-surface-tertiary p-6 shadow-elevation-light-m",
              contentClassName,
            )}
          >
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}
