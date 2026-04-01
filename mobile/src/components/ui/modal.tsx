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
import { useColorScheme } from "nativewind";
import * as React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import colors from "./colors";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";

import { Text } from "./text";

type ModalProps = BottomSheetModalProps & {
  title?: string;
  headerTitle?: React.ReactNode;
  showHandle?: boolean;
  handleColor?: string;
  handleBackgroundColor?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
};

type ModalRef = React.ForwardedRef<BottomSheetModal>;

type ModalHeaderProps = {
  title?: string;
  headerTitle?: React.ReactNode;
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
      snapPoints: providedSnapPoints,
      title,
      headerTitle,
      detached = false,
      showHandle = true,
      handleColor,
      handleBackgroundColor,
      headerLeft,
      headerRight,
      enableDynamicSizing = false,
      ...props
    }: ModalProps,
    ref: ModalRef,
  ) => {
    const { bottom: bottomInset } = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const resolvedHandleColor =
      handleColor ?? (isDark ? colors.charcoal[600] : colors.neutral[300]);
    const resolvedHandleBackgroundColor =
      handleBackgroundColor ??
      (isDark
        ? resolveThemeTokenColor("dark", "--color-surface-primary")
        : undefined);
    const resolvedBackgroundStyle =
      props.backgroundStyle ??
      (isDark
        ? {
            backgroundColor: resolveThemeTokenColor(
              "dark",
              "--color-surface-primary",
            ),
          }
        : undefined);
    const detachedProps = React.useMemo(
      () => getDetachedProps(detached),
      [detached],
    );
    const modal = useModal();
    const snapPoints = React.useMemo(() => {
      if (providedSnapPoints) return providedSnapPoints;
      if (enableDynamicSizing) return undefined;
      return ["60%"];
    }, [enableDynamicSizing, providedSnapPoints]);

    React.useImperativeHandle(
      ref,
      () => (modal.ref.current as BottomSheetModal) || null,
    );

    const renderHandleComponent = React.useCallback(
      () => (
        <View
          className="px-1 pb-2"
          style={{
            backgroundColor: resolvedHandleBackgroundColor ?? "transparent",
          }}
        >
          <View
            className="mb-8 mt-2 h-1 w-12 self-center rounded-lg"
            style={{
              backgroundColor: resolvedHandleColor,
            }}
          />
          <ModalHeader
            title={title}
            headerTitle={headerTitle}
            headerLeft={headerLeft}
            headerRight={headerRight}
          />
        </View>
      ),
      [
        title,
        headerTitle,
        resolvedHandleColor,
        resolvedHandleBackgroundColor,
        headerLeft,
        headerRight,
      ],
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
        enableDynamicSizing={enableDynamicSizing}
        handleComponent={showHandle ? renderHandleComponent : emptyHandle}
        bottomInset={detached ? undefined : bottomInset}
        backgroundStyle={resolvedBackgroundStyle}
      />
    );
  },
);

/**
 * Custom Backdrop
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CustomBackdrop = ({ style, animatedIndex }: BottomSheetBackdropProps) => {
  const { close } = useBottomSheet();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [-1, 0], [0, 1], "clamp"),
  }));

  return (
    <AnimatedPressable
      onPress={() => close()}
      style={[style, { backgroundColor: "rgba(0, 0, 0, 0.4)" }, animatedStyle]}
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
  ({ title, headerTitle, headerLeft, headerRight }: ModalHeaderProps) => {
    return (
      <>
        {(headerTitle || title) && (
          <View className="flex-row items-center px-2 py-4">
            <View className="w-[48px] items-start">{headerLeft}</View>
            <View className="flex-1 items-center">
              {headerTitle ?? (
                <Text className="text-center text-2xl font-matter text-primary dark:text-white">
                  {title}
                </Text>
              )}
            </View>
            <View className="w-[48px] items-end">{headerRight}</View>
          </View>
        )}
      </>
    );
  },
);
