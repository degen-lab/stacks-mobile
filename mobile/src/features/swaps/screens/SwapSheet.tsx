import { ChevronLeft, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";

import { Modal, ScrollView, colors, useModal } from "@/components/ui";
import { useSwap } from "../hooks/use-swap";
import type { SwapSheetRequest } from "../types";
import { SwapFormView } from "./SwapFormView";
import { SwapFormSkeleton } from "./SwapFormView.skeleton";
import { SwapPickerView } from "./SwapPickerView";
import { SwapReviewView } from "./SwapReviewView";

type SwapSheetProps = {
  open: boolean;
  onClose: () => void;
  request?: SwapSheetRequest;
  requestVersion?: number;
};

export function SwapSheet({
  open,
  onClose,
  request,
  requestVersion,
}: SwapSheetProps) {
  const { ref, present, dismiss } = useModal();
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      present();
      return;
    }
    if (!hasOpenedRef.current) return;
    dismiss();
    hasOpenedRef.current = false;
  }, [dismiss, open, present]);

  const swap = useSwap({ open, request, requestVersion, onClose });
  const isPicker =
    swap.step === "picker-source" || swap.step === "picker-destination";

  useEffect(() => {
    if (!open) return;
    const index = isPicker ? 2 : swap.step === "review" ? 1 : 0;
    ref.current?.snapToIndex(index);
  }, [isPicker, swap.step, open, ref]);

  const title =
    swap.step === "review"
      ? "Review swap"
      : swap.step === "picker-source"
        ? "Select token"
        : swap.step === "picker-destination"
          ? "Swap to"
          : "Swap";

  const renderContent = () => {
    if (isPicker) {
      return <SwapPickerView swap={swap} />;
    }

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 px-4 pb-6 pt-2"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {swap.isLoading ? (
            <SwapFormSkeleton />
          ) : swap.step === "review" ? (
            <SwapReviewView swap={swap} />
          ) : (
            <SwapFormView swap={swap} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Modal
      ref={ref}
      title={title}
      snapPoints={["74%", "88%", "90%"]}
      backgroundStyle={{ backgroundColor: colors.neutral[50] }}
      enablePanDownToClose
      onDismiss={swap.onDismiss}
      headerLeft={
        swap.step !== "form" ? (
          <Pressable style={styles.headerButton} onPress={swap.onBack}>
            <ChevronLeft size={20} color={colors.neutral[700]} />
          </Pressable>
        ) : null
      }
      headerRight={
        <Pressable style={styles.headerButton} onPress={onClose}>
          <X size={20} color={colors.neutral[400]} />
        </Pressable>
      }
    >
      {renderContent()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
