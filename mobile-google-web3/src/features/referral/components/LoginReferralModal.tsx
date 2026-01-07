import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Asset } from "expo-asset";
import * as React from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { SvgUri } from "react-native-svg";
import { z } from "zod";

import { Button } from "../../../components/ui/button";
import { ControlledInput } from "../../../components/ui/input";
import { Modal, useModal } from "../../../components/ui/modal";
import { Text } from "../../../components/ui/text";

const referralCodeSchema = z.object({
  referralCode: z
    .string()
    .refine((val) => {
      const trimmed = val.trim();
      return trimmed.length === 0 || /^[A-Z0-9]+$/.test(trimmed);
    }, "Referral code must contain only uppercase letters and numbers")
    .refine((val) => {
      const trimmed = val.trim();
      return trimmed.length === 0 || trimmed.length === 8;
    }, "Referral code must be exactly 8 characters"),
});

type ReferralCodeFormData = z.infer<typeof referralCodeSchema>;

type ReferralCodeModalProps = {
  onConfirm: (code: string) => void | Promise<void>;
  onSkip: () => void;
  onDismiss?: () => void;
  loading?: boolean;
};

export const useReferralCodeModal = () => {
  const { ref, present: basePresent, dismiss } = useModal();
  const isOpenRef = React.useRef(false);
  const pendingCallbackRef = React.useRef<(() => void) | null>(null);

  const present = React.useCallback(
    (data?: any) => {
      isOpenRef.current = true;
      basePresent(data);
    },
    [basePresent],
  );

  const dismissWithCallback = React.useCallback(
    (callback: () => void) => {
      if (isOpenRef.current) {
        pendingCallbackRef.current = callback;
        dismiss();
      } else {
        callback();
      }
    },
    [dismiss],
  );

  const onDismiss = React.useCallback(() => {
    isOpenRef.current = false;
    const callback = pendingCallbackRef.current;
    pendingCallbackRef.current = null;
    callback?.();
  }, []);

  return { ref, present, dismiss, dismissWithCallback, onDismiss };
};

export const ReferralCodeModal = React.forwardRef<
  BottomSheetModal,
  ReferralCodeModalProps
>(({ onConfirm, onSkip, onDismiss, loading = false }, ref) => {
  const { control, handleSubmit, reset } = useForm<ReferralCodeFormData>({
    resolver: zodResolver(referralCodeSchema),
    defaultValues: {
      referralCode: "",
    },
  });

  const onSubmit = async (data: ReferralCodeFormData) => {
    try {
      await onConfirm(data.referralCode.trim());
      reset();
    } catch {
      // Error handling is done by the parent component
    }
  };

  const handleSkip = () => {
    reset();
    onSkip();
  };

  const handleDismiss = () => {
    reset();
    onDismiss?.();
  };

  const giftAsset = Asset.fromModule(require("@/assets/images/gift.svg"));

  return (
    <Modal
      ref={ref}
      snapPoints={["58%"]}
      showHandle={true}
      onDismiss={handleDismiss}
    >
      <View className="flex-1 px-6 pb-8">
        {/* Icon */}
        <View className="items-center mb-12 mt-4">
          <View
            className="items-center justify-center"
            style={{
              width: 80,
              height: 80,
            }}
          >
            <SvgUri uri={giftAsset.uri} width={110} height={110} />
          </View>
        </View>

        {/* Title */}
        <Text className="text-center text-3xl font-matter text-primary dark:text-white mb-2">
          Claim Your Bonus
        </Text>

        {/* Subtitle */}
        <Text className="text-center text-base font-instrument-sans text-secondary dark:text-neutral-300 mb-8">
          Enter a friend&apos;s code to start with 100 free points.
        </Text>

        {/* Input */}
        <View className="mb-6">
          <ControlledInput
            name="referralCode"
            control={control}
            placeholder="Paste code (e.g., A1B2C3D4)"
            autoCapitalize="characters"
            autoCorrect={false}
            testID="referral-code-input"
          />
        </View>

        <View className="space-y-3">
          <Button
            label="Claim Reward"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            size="lg"
            variant="default"
            testID="claim-reward-button"
          />
          <Button
            label="No, continue without bonus"
            onPress={handleSkip}
            variant="ghost"
            size="lg"
            testID="continue-without-bonus-button"
          />
        </View>
      </View>
    </Modal>
  );
});

ReferralCodeModal.displayName = "ReferralCodeModal";
