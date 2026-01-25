/**
 * Modal
 * Dependencies:
 * - @gorhom/bottom-sheet.
 *
 * Props:
 * - All `BottomSheetModalProps` props.
 * - `title` (string | undefined): Optional title for the modal header.
 *
 * Usage Example:
 * import { Modal, useModal } from '@gorhom/bottom-sheet';
 *
 * function DisplayModal() {
 *   const { ref, present, dismiss } = useModal();
 *
 *   return (
 *     <View>
 *       <Modal
 *         snapPoints={['60%']} // optional
 *         title="Modal Title"
 *         ref={ref}
 *       >
 *         Modal Content
 *       </Modal>
 *     </View>
 *   );
 * }
 *
 */

import type {
  BottomSheetBackdropProps,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { BottomSheetModal, useBottomSheet } from "@gorhom/bottom-sheet";
import * as React from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import colors from "./colors";

import { Text } from "./text";

type ModalProps = BottomSheetModalProps & {
  title?: string;
  showHandle?: boolean;
  handleColor?: string;
  handleBackgroundColor?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
};

type ModalRef = React.ForwardedRef<BottomSheetModal>;

type ModalHeaderProps = {
  title?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
};

export const useModal = () => {
  const ref = React.useRef<BottomSheetModal>(null);
  const present = React.useCallback((data?: any) => {
    ref.current?.present(data);
  }, []);
  const dismiss = React.useCallback(() => {
    ref.current?.dismiss();
  }, []);
  return { ref, present, dismiss };
};

// eslint-disable-next-line react/display-name
export const Modal = React.forwardRef(
  (
    {
      snapPoints: _snapPoints = ["60%"],
      title,
      detached = false,
      showHandle = true,
      handleColor = colors.neutral[300],
      handleBackgroundColor,
      headerLeft,
      headerRight,
      ...props
    }: ModalProps,
    ref: ModalRef,
  ) => {
    const detachedProps = React.useMemo(
      () => getDetachedProps(detached),
      [detached],
    );
    const modal = useModal();
    const snapPoints = React.useMemo(() => _snapPoints, [_snapPoints]);

    React.useImperativeHandle(
      ref,
      () => (modal.ref.current as BottomSheetModal) || null,
    );

    const renderHandleComponent = React.useCallback(
      () => (
        <View
          className="px-1 pb-2"
          style={{
            backgroundColor: handleBackgroundColor ?? "transparent",
          }}
        >
          <View
            className="mb-8 mt-2 h-1 w-12 self-center rounded-lg"
            style={{
              backgroundColor: handleColor,
            }}
          />
          <ModalHeader
            title={title}
            headerLeft={headerLeft}
            headerRight={headerRight}
          />
        </View>
      ),
      [title, handleColor, handleBackgroundColor, headerLeft, headerRight],
    );

    const emptyHandle = React.useCallback(() => null, []);

    return (
      <BottomSheetModal
        {...props}
        {...detachedProps}
        ref={modal.ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={props.backdropComponent || renderBackdrop}
        enableDynamicSizing={false}
        handleComponent={showHandle ? renderHandleComponent : emptyHandle}
      />
    );
  },
);

/**
 * Custom Backdrop
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CustomBackdrop = ({ style }: BottomSheetBackdropProps) => {
  const { close } = useBottomSheet();
  return (
    <AnimatedPressable
      onPress={() => close()}
      entering={FadeIn.duration(50)}
      exiting={FadeOut.duration(20)}
      style={[style, { backgroundColor: "rgba(0, 0, 0, 0.4)" }]}
    />
  );
};

export const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <CustomBackdrop {...props} />
);

/**
 *
 * @param detached
 * @returns
 *
 * @description
 * In case the modal is detached, we need to add some extra props to the modal to make it look like a detached modal.
 */

const getDetachedProps = (detached: boolean) => {
  if (detached) {
    return {
      detached: true,
      bottomInset: 46,
      style: { marginHorizontal: 16, overflow: "hidden" },
    } as Partial<BottomSheetModalProps>;
  }
  return {} as Partial<BottomSheetModalProps>;
};

/**
 * ModalHeader
 */

// eslint-disable-next-line react/display-name
const ModalHeader = React.memo(
  ({ title, headerLeft, headerRight }: ModalHeaderProps) => {
    return (
      <>
        {title && (
          <View className="flex-row items-center px-2 py-4">
            <View className="w-[48px] items-start">{headerLeft}</View>
            <View className="flex-1">
              <Text className="text-center text-2xl font-matter text-primary dark:text-white">
                {title}
              </Text>
            </View>
            <View className="w-[48px] items-end">{headerRight}</View>
          </View>
        )}
      </>
    );
  },
);
