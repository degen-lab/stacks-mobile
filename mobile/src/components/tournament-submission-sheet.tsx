import type { ImageSource } from "expo-image";

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
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";
import { TransactionFundingActions } from "./transaction-funding-actions";
import { WarningLabel } from "./warning-label";
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
  onSubmitWallet: () => Promise<string | void>;
  onCancel: () => void;
  onSuccess: (txId: string) => void;
  rewardAmount?: string;
  estimatedFee?: number;
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
      walletHasEnoughBalance,
      onAddFunds,
      showRankChange = true,
      resetKey,
      estimatedFee,
      userAvatarSource,
      userDisplayName,
      sponsoredSubmissionsLeft,
      weeklyContestSubmissionsLeft,
      raffleSubmissionsLeft,
      network,
      contractAddress,
      functionName,
      contractArgs,
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

    const resetState = React.useCallback(() => {
      setSheetState("initial");
      setLastMethod(null);
      setErrorMessage(null);
    }, []);

    React.useEffect(() => {
      resetState();
    }, [resetKey, resetState]);

    const walletCtaLabel =
      walletHasEnoughBalance === false ? "Add funds" : "Use wallet balance";
    const sponsoredLeft = showRankChange
      ? weeklyContestSubmissionsLeft
      : raffleSubmissionsLeft;
    const sponsoredLabel = !canSubmit
      ? "Please wait for Submit Phase to start"
      : sponsoredLeft === 0
        ? "All free entries used today"
        : canUseSponsored
          ? `Submit for free by watching an ad (${sponsoredLeft} left)`
          : "Watch an ad to submit";
    const canUseSponsoredButton =
      canSubmit && (sponsoredLeft === undefined || sponsoredLeft > 0);

    // TODO: Calculate real estimated fee based on actual transaction size and current network fee rates
    // This should query the Stacks API or use a fee estimation service to get accurate fees
    const cappedFee = estimatedFee ? Math.min(estimatedFee, 0.01) : 0;
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
          return showRankChange ? "Submit Highscore!" : "Submit Raffle Entry";
      }
    }, [sheetState, showRankChange]);

    const submittingLabel = React.useMemo(
      () =>
        showRankChange ? "Submitting highscore" : "Submitting raffle entry",
      [showRankChange],
    );

    const handleSubmit = React.useCallback(
      async (method: TransactionMethod) => {
        setLastMethod(method);
        setErrorMessage(null);
        setSheetState("submitting");
        try {
          const txId =
            method === "sponsored"
              ? await onSubmitSponsored()
              : await onSubmitWallet();
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
      void handleSubmit(lastMethod);
    }, [handleSubmit, lastMethod]);

    const handleWalletPress = React.useCallback(() => {
      if (walletHasEnoughBalance === false && onAddFunds) {
        onAddFunds();
        return;
      }
      void handleSubmit("wallet");
    }, [walletHasEnoughBalance, onAddFunds, handleSubmit]);

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
                  title={title}
                  network={network}
                  contractAddress={contractAddress}
                  functionName={functionName}
                  contractArgs={contractArgs}
                  onAdvancedToggle={setShowAdvancedOnly}
                />
              )}

              {!showAdvancedOnly && (
                <>
                  {showRankChange ? (
                    <>
                      {estimatedFee && cappedFee > 0 && (
                        <View className="my-2">
                          <WarningLabel
                            label={`We are using blockchain to ensure transparency. \n Transaction fee:  ~${cappedFee} STX.`}
                          />
                        </View>
                      )}
                      <WeeklyTournamentPreview
                        projectedUser={projectedUser ?? undefined}
                        avatarFallback={fallbackAvatar}
                      />
                    </>
                  ) : (
                    <View className="mt-2 mb-4">
                      <View className="mb-4">
                        <WarningLabel
                          label={`We are using blockchain to ensure transparency. \n Transaction fee:  ~${cappedFee} STX.`}
                        />
                      </View>
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
                        Higher scores = increased chance of winning
                      </Text>
                      <Text className="text-center text-sm font-instrument-sans text-secondary/70 dark:text-neutral-400">
                        More submissions = increased chance of winning
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
                  walletDisabled={!canSubmit}
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
