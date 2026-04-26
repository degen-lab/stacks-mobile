import type { ImageSource } from "expo-image";
import type { ClarityValue } from "@stacks/transactions";

import {
  Button,
  ClassicTicket,
  Modal,
  Spinner,
  Text,
  View,
  colors,
} from "@/components/ui";
import { WeeklyTournamentPreview } from "@/features/leaderboard/components/submission-tournament-card";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import React from "react";
import { useContractCallFee } from "@/hooks/use-contract-call-fee";
import { MICRO_STX } from "@/lib/format/currency";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";
import { TransactionFundingActions } from "./transaction-funding-actions";
import {
  ContractTxDetails,
  type ContractArgument,
} from "./contract-tx-details";
import type { TransactionMethod } from "@/lib/enums";

type SheetState = "initial" | "submitting" | "error";

type TournamentSubmissionSheetProps = {
  score: number;
  currentRank?: number | null;
  projectedRank?: number | null;
  tournamentId: string;
  tournamentName: string;
  canUseSponsored: boolean;
  canSubmit?: boolean;
  walletBalance?: number;
  onSubmitSponsored: () => Promise<string | void>;
  onSubmitWallet: (feeMicroStx?: number) => Promise<string | void>;
  onCancel: () => void;
  onSuccess: (txId: string) => void;
  userAvatarSource?: ImageSource;
  userDisplayName?: string;
  walletHasEnoughBalance?: boolean;
  onAddFunds?: () => void;
  showRankChange?: boolean;
  resetKey?: string | number;
  sponsoredSubmissionsLeft?: number;
  weeklyContestSubmissionsLeft?: number;
  raffleSubmissionsLeft?: number;
  // Transaction details
  network?: string;
  contractAddress?: string;
  functionName?: string;
  contractArgs?: ContractArgument[];
  feeFunctionArgs?: ClarityValue[];
  isLoadingFeeArgs?: boolean;
};

export const TournamentSubmissionSheet = React.forwardRef<
  BottomSheetModal,
  TournamentSubmissionSheetProps
>(
  (
    {
      score,
      projectedRank,
      tournamentId,
      tournamentName,
      canUseSponsored,
      canSubmit = true,
      onSubmitSponsored,
      onSubmitWallet,
      onCancel,
      onSuccess,
      walletBalance,
      walletHasEnoughBalance,
      onAddFunds,
      showRankChange = true,
      resetKey,
      userAvatarSource,
      userDisplayName,
      sponsoredSubmissionsLeft,
      weeklyContestSubmissionsLeft,
      raffleSubmissionsLeft,
      network,
      contractAddress,
      functionName,
      contractArgs,
      feeFunctionArgs,
      isLoadingFeeArgs = false,
    },
    ref,
  ) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [sheetState, setSheetState] = React.useState<SheetState>("initial");
    const [lastMethod, setLastMethod] =
      React.useState<TransactionMethod | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [showAdvancedOnly, setShowAdvancedOnly] = React.useState(false);
    const sheetBackground = isDark
      ? resolveThemeTokenColor("dark", "--color-surface-primary")
      : colors.white;
    const showFeeSelector = Boolean(
      network && contractAddress?.includes(".") && functionName,
    );
    const {
      selectedFeeOption,
      setSelectedFeeOption,
      customFee,
      setCustomFee,
      feeMicroStx,
      isFeeValid,
      isFeeUnavailable,
      isLoadingFees,
      resetFeeState,
    } = useContractCallFee({
      contractId: contractAddress ?? "",
      functionName: functionName ?? "",
      functionArgs: feeFunctionArgs ?? [],
      enabled:
        showFeeSelector &&
        !isLoadingFeeArgs &&
        sheetState === "initial" &&
        Boolean(feeFunctionArgs?.length),
    });
    const walletFeeLoading =
      showFeeSelector && (isLoadingFeeArgs || isLoadingFees);
    const canUseWalletEstimatedFee =
      showFeeSelector &&
      selectedFeeOption !== "custom" &&
      !walletFeeLoading &&
      (feeMicroStx === undefined || isFeeUnavailable);
    const isWalletFeeInvalid =
      showFeeSelector &&
      !walletFeeLoading &&
      !isFeeValid &&
      !canUseWalletEstimatedFee;
    const hasEnoughWalletBalance =
      walletBalance == null
        ? walletHasEnoughBalance !== false
        : feeMicroStx !== undefined
          ? walletBalance >= feeMicroStx / MICRO_STX
          : walletBalance > 0;

    const resetState = React.useCallback(() => {
      setSheetState("initial");
      setLastMethod(null);
      setErrorMessage(null);
      setShowAdvancedOnly(false);
    }, []);

    React.useEffect(() => {
      resetState();
      resetFeeState();
    }, [resetFeeState, resetKey, resetState]);

    const walletCtaLabel = hasEnoughWalletBalance
      ? "Use wallet balance"
      : "Add funds";
    const sponsoredLeft = showRankChange
      ? weeklyContestSubmissionsLeft
      : raffleSubmissionsLeft;
    const sponsoredLabel = !canSubmit
      ? "Please wait for Submit Phase to start"
      : sponsoredLeft === 0
        ? showRankChange
          ? "All free entries used today"
          : "All sponsored entries used today"
        : canUseSponsored
          ? showRankChange
            ? `Submit for free by watching an ad (${sponsoredLeft} left)`
            : `Watch an ad for sponsored entry (${sponsoredLeft} left)`
          : showRankChange
            ? "Watch an ad to submit"
            : "Watch an ad for sponsored entry";
    const canUseSponsoredButton =
      canSubmit && (sponsoredLeft === undefined || sponsoredLeft > 0);
    const fallbackAvatar = React.useMemo(
      () => require("@/assets/images/icon.png"),
      [],
    );
    const projectedUser = React.useMemo(() => {
      if (!showRankChange) return null;
      const name = userDisplayName?.trim() || "Stacks user";
      const rank = projectedRank ?? 0;

      return {
        rank,
        rankLabel: projectedRank == null ? "?" : undefined,
        name,
        score,
        photoUri: userAvatarSource,
      };
    }, [
      projectedRank,
      score,
      showRankChange,
      userAvatarSource,
      userDisplayName,
    ]);

    const title = React.useMemo(() => {
      switch (sheetState) {
        case "submitting":
          return "Submitting...";
        case "error":
          return "Submission Failed";
        default:
          return showRankChange ? "Submit Highscore!" : "Weekly Entry";
      }
    }, [sheetState, showRankChange]);

    const submittingLabel = React.useMemo(
      () => (showRankChange ? "Submitting highscore" : "Submitting entry"),
      [showRankChange],
    );

    const handleSubmit = React.useCallback(
      async (method: TransactionMethod, walletFeeMicroStx?: number) => {
        setLastMethod(method);
        setErrorMessage(null);
        setSheetState("submitting");
        try {
          const txId =
            method === "sponsored"
              ? await onSubmitSponsored()
              : await onSubmitWallet(walletFeeMicroStx);
          if (txId) {
            onSuccess(txId);
          }
          onCancel();
          setSheetState("initial");
        } catch (error) {
          setSheetState("error");
          if (error instanceof Error && error.message) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage("Please check your connection and try again.");
          }
        }
      },
      [onSubmitSponsored, onSubmitWallet, onSuccess, onCancel],
    );

    const handleRetry = React.useCallback(() => {
      if (!lastMethod) return;
      void handleSubmit(
        lastMethod,
        lastMethod === "wallet" ? feeMicroStx : undefined,
      );
    }, [feeMicroStx, handleSubmit, lastMethod]);

    const handleWalletPress = React.useCallback(() => {
      if (!hasEnoughWalletBalance && onAddFunds) {
        onAddFunds();
        return;
      }
      void handleSubmit("wallet", feeMicroStx);
    }, [feeMicroStx, handleSubmit, hasEnoughWalletBalance, onAddFunds]);

    return (
      <Modal
        ref={ref}
        title={undefined}
        enableDynamicSizing={true}
        handleBackgroundColor={sheetBackground}
        backgroundStyle={{
          backgroundColor: sheetBackground,
        }}
        enablePanDownToClose={sheetState === "initial"}
        enableHandlePanningGesture={sheetState === "initial"}
        enableContentPanningGesture={sheetState === "initial"}
        onDismiss={onCancel}
      >
        <BottomSheetScrollView
          contentContainerClassName="px-6 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          {sheetState === "initial" ? (
            <>
              {/* Transaction Details */}
              {network && contractAddress && functionName && (
                <ContractTxDetails
                  key={`${resetKey ?? "default"}-${tournamentId}-${showRankChange ? "tournament" : "raffle"}`}
                  title={title}
                  network={network}
                  contractAddress={contractAddress}
                  functionName={functionName}
                  contractArgs={contractArgs}
                  showFeeSelector={showFeeSelector}
                  feeHelperText={
                    showFeeSelector
                      ? "Wallet submissions only use this fee."
                      : undefined
                  }
                  selectedFeeOption={selectedFeeOption}
                  onSelectFee={setSelectedFeeOption}
                  customFee={customFee}
                  onCustomFeeChange={setCustomFee}
                  feeMicroStx={feeMicroStx}
                  isLoadingFees={walletFeeLoading}
                  isFeeValid={isFeeValid}
                  isFeeUnavailable={isFeeUnavailable}
                  onAdvancedToggle={setShowAdvancedOnly}
                />
              )}

              {!showAdvancedOnly && (
                <>
                  {showRankChange ? (
                    <>
                      <WeeklyTournamentPreview
                        projectedUser={projectedUser ?? undefined}
                        avatarFallback={fallbackAvatar}
                      />
                    </>
                  ) : (
                    <View className="mt-2 mb-4">
                      <View className="flex-row items-center justify-center gap-2 my-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <ClassicTicket
                            key={index}
                            active={index < (sponsoredSubmissionsLeft ?? 0)}
                            backgroundColor={colors.neutral[50]}
                          />
                        ))}
                      </View>
                      <Text className="text-center text-sm font-instrument-sans text-secondary/70 dark:text-neutral-400">
                        Pay the network fee, or watch an ad for a sponsored
                        entry.
                      </Text>
                      <Text className="text-center text-sm font-instrument-sans text-secondary/70 dark:text-neutral-400">
                        The ad covers entry costs and does not affect selection.
                      </Text>
                      <Text className="text-center text-sm font-instrument-sans text-secondary/70 dark:text-neutral-400">
                        Confirmed entries count toward this week&apos;s raffle.
                      </Text>
                    </View>
                  )}
                </>
              )}

              {!showAdvancedOnly && (
                <TransactionFundingActions
                  sponsoredLabel={sponsoredLabel}
                  walletLabel={walletCtaLabel}
                  onPressSponsored={() => void handleSubmit("sponsored")}
                  onPressWallet={handleWalletPress}
                  sponsoredDisabled={!canUseSponsoredButton}
                  walletDisabled={
                    !canSubmit ||
                    (hasEnoughWalletBalance &&
                      (walletFeeLoading || isWalletFeeInvalid))
                  }
                />
              )}
            </>
          ) : null}

          {sheetState === "submitting" ? (
            <View className="items-center py-12">
              <Spinner
                color={colors.primary[600]}
                size={64}
                trackColor={colors.neutral[200]}
              />
              <Text className="mt-6 text-base font-matter text-primary dark:text-white">
                {submittingLabel}
              </Text>
              <Text className="mt-2 text-sm font-instrument-sans text-secondary dark:text-neutral-300">
                This may take a few seconds.
              </Text>
            </View>
          ) : null}

          {sheetState === "error" ? (
            <View className="items-center py-10">
              <View className="h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
                <Text className="text-2xl font-semibold text-red-600">!</Text>
              </View>
              <Text className="mt-5 text-lg font-matter text-primary dark:text-white">
                Submission failed
              </Text>
              <Text className="mt-2 text-center text-sm font-instrument-sans text-secondary dark:text-neutral-300">
                {errorMessage ?? "Please check your connection and try again."}
              </Text>
              <View className="mt-6 w-full gap-3">
                <Button
                  label="Try Again"
                  variant="gamePrimary"
                  size="game"
                  onPress={handleRetry}
                />
                <Button
                  label="Close"
                  variant="gameOutline"
                  size="game"
                  onPress={onCancel}
                />
              </View>
            </View>
          ) : null}
        </BottomSheetScrollView>
      </Modal>
    );
  },
);

TournamentSubmissionSheet.displayName = "TournamentSubmissionSheet";
