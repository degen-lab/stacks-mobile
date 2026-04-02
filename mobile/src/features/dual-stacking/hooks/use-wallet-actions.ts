import { showMessage } from "react-native-flash-message";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PostConditionMode, principalCV } from "@stacks/transactions";

import { saveUnenrollmentReasons } from "@/api/dual-stacking/enrollment";
import { copyToClipboard } from "@/lib/clipboard";
import { getExplorerUrl } from "@/lib/stacks/network";
import { isValidPrincipal } from "@/lib/stacks/addresses";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import type { UnenrollReasonKey } from "@/api/dual-stacking/enrollment/save-unenrollment-reasons";
import {
  invalidateEnrollmentQueries,
  optimisticSetEnrolled,
  useTrackEnrollTx,
} from "@/features/dual-stacking/hooks/use-track-enroll-tx";
import { useSponsoredStacksTransaction } from "@/hooks/use-sponsored-stacks-transaction";
import { buildUnsignedContractCall } from "@/lib/stacks/transaction-builder";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { useSelectedNetwork } from "@/lib/store/settings";
import { getActiveWalletAccount } from "@/lib/stacks/active-account";
import { trackEvent } from "@/lib/analytics";
import type { TransactionMethod } from "@/lib/enums";
import { contractOptOut } from "../contract-calls/opt-out";
import { contractChangeRewardsAddress } from "../contract-calls/change-reward-address";

export function useWalletActions() {
  const queryClient = useQueryClient();
  const { stxAddress } = useWalletAddresses();
  const { selectedNetwork } = useSelectedNetwork();
  const { submitSponsoredTransaction, isSubmittingSponsored } =
    useSponsoredStacksTransaction();
  const [optOutTxId, setOptOutTxId] = useState<string | null>(null);
  const [isOptOutSubmitting, setIsOptOutSubmitting] = useState(false);
  const [optOutStatus, setOptOutStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [optOutFunding, setOptOutFunding] = useState<TransactionMethod | null>(
    null,
  );

  const [changeAddressTxId, setChangeAddressTxId] = useState<string | null>(
    null,
  );
  const [isChangeAddressSubmitting, setIsChangeAddressSubmitting] =
    useState(false);
  const [changeAddressStatus, setChangeAddressStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [changeAddressFunding, setChangeAddressFunding] =
    useState<TransactionMethod | null>(null);

  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const contractId = CONTRACTS[selectedNetwork][contractType];
  const optOutFunctionName = SC_FUNCTIONS[contractType].publicFunctions.OPT_OUT;
  const changeRewardAddressFunctionName =
    SC_FUNCTIONS[contractType].publicFunctions.CHANGE_REWARDS_ADDRESS;

  const invalidateDualStackingState = useCallback(() => {
    invalidateEnrollmentQueries(queryClient);
    void queryClient.invalidateQueries({
      queryKey: ["latest-reward-address"],
    });
  }, [queryClient]);

  const scheduleDualStackingRefresh = useCallback(() => {
    setTimeout(() => {
      invalidateDualStackingState();
    }, 20_000);
  }, [invalidateDualStackingState]);

  const openInExplorer = async () => {
    if (!stxAddress) return;

    await openBrowserAsync(getExplorerUrl(stxAddress).explorerUrl, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  };

  const copyAddress = async () => {
    if (!stxAddress) return;

    await copyToClipboard(stxAddress, "Address copied to clipboard");
  };

  const optOut = async ({
    reasons = [],
    feeMicroStx,
  }: {
    reasons?: UnenrollReasonKey[];
    feeMicroStx?: number;
  }): Promise<boolean> => {
    if (!stxAddress) return false;
    setIsOptOutSubmitting(true);
    setOptOutStatus("loading");

    try {
      setOptOutFunding("wallet");
      const txId = await contractOptOut(feeMicroStx);

      if (reasons.length > 0) {
        try {
          await saveUnenrollmentReasons(stxAddress, reasons);
        } catch (error) {
          console.warn("Failed to save unenrollment reasons", error);
        }
      }

      setOptOutTxId(txId ?? null);
      setOptOutStatus("loading");
      return true;
    } catch (error) {
      showMessage({
        message: "Opt-out cancelled",
        description: String(error),
        type: "danger",
      });
      setIsOptOutSubmitting(false);
      setOptOutStatus("error");
      return false;
    }
  };

  const optOutSponsored = async ({
    reasons = [],
    feeMicroStx,
  }: {
    reasons?: UnenrollReasonKey[];
    feeMicroStx?: number;
  }): Promise<boolean> => {
    if (!stxAddress) return false;
    setIsOptOutSubmitting(true);
    setOptOutStatus("loading");

    try {
      setOptOutFunding("sponsored");
      const { account, accountIndex, address } = await getActiveWalletAccount();
      const unsignedSerializedTx = await buildUnsignedContractCall({
        contractId,
        functionName: optOutFunctionName,
        functionArgs: [],
        network: selectedNetwork,
        publicKey: account.publicKey,
        feeMicroStx,
        sponsored: true,
        postConditionMode: PostConditionMode.Allow,
      });

      await submitSponsoredTransaction({
        originAddress: address,
        accountIndex,
        unsignedSerializedTx,
      });

      if (reasons.length > 0) {
        try {
          await saveUnenrollmentReasons(stxAddress, reasons);
        } catch (error) {
          console.warn("Failed to save unenrollment reasons", error);
        }
      }

      setIsOptOutSubmitting(false);
      setOptOutStatus("success");
      scheduleDualStackingRefresh();
      return true;
    } catch (error) {
      showMessage({
        message: "Opt-out cancelled",
        description: String(error),
        type: "danger",
      });
      setIsOptOutSubmitting(false);
      setOptOutStatus("error");
      return false;
    }
  };

  const changeRewardAddress = async ({
    rewardAddress,
    feeMicroStx,
  }: {
    rewardAddress: string;
    feeMicroStx?: number;
  }): Promise<boolean> => {
    const value = rewardAddress.trim();
    if (!isValidPrincipal(value)) return false;

    setIsChangeAddressSubmitting(true);
    setChangeAddressStatus("loading");

    try {
      setChangeAddressFunding("wallet");
      const txId = await contractChangeRewardsAddress(value, feeMicroStx);

      setChangeAddressTxId(txId ?? null);
      return true;
    } catch {
      setIsChangeAddressSubmitting(false);
      setChangeAddressStatus("error");
      return false;
    }
  };

  const changeRewardAddressSponsored = async ({
    rewardAddress,
    feeMicroStx,
  }: {
    rewardAddress: string;
    feeMicroStx?: number;
  }): Promise<boolean> => {
    const value = rewardAddress.trim();
    if (!isValidPrincipal(value)) return false;

    setIsChangeAddressSubmitting(true);
    setChangeAddressStatus("loading");

    try {
      setChangeAddressFunding("sponsored");
      const { account, accountIndex, address } = await getActiveWalletAccount();
      const unsignedSerializedTx = await buildUnsignedContractCall({
        contractId,
        functionName: changeRewardAddressFunctionName,
        functionArgs: [principalCV(value)],
        network: selectedNetwork,
        publicKey: account.publicKey,
        feeMicroStx,
        sponsored: true,
        postConditionMode: PostConditionMode.Allow,
      });

      await submitSponsoredTransaction({
        originAddress: address,
        accountIndex,
        unsignedSerializedTx,
      });

      void trackEvent("dual_stacking_change_reward_address");
      setIsChangeAddressSubmitting(false);
      setChangeAddressStatus("success");
      scheduleDualStackingRefresh();
      return true;
    } catch {
      setIsChangeAddressSubmitting(false);
      setChangeAddressStatus("error");
      return false;
    }
  };

  useTrackEnrollTx({
    txId: optOutTxId,
    onSuccess: () => {
      setIsOptOutSubmitting(false);
      setOptOutStatus("success");
      optimisticSetEnrolled(queryClient, {
        isEnrolledNextCycle: false,
      });
      scheduleDualStackingRefresh();
      setOptOutTxId(null);
    },
    onFailure: (_status, repr) => {
      setOptOutStatus("error");
      setIsOptOutSubmitting(false);
      setOptOutTxId(null);
      showMessage({
        message: "Opt-out failed",
        description: repr,
        type: "danger",
      });
    },
  });

  useTrackEnrollTx({
    txId: changeAddressTxId,
    onSuccess: () => {
      setIsChangeAddressSubmitting(false);
      setChangeAddressStatus("success");
      invalidateDualStackingState();
      setChangeAddressTxId(null);
    },
    onFailure: (_status, repr) => {
      setChangeAddressStatus("error");
      setIsChangeAddressSubmitting(false);
      setChangeAddressTxId(null);
      showMessage({
        message: "Update failed",
        description: repr,
        type: "danger",
      });
    },
  });

  return {
    openInExplorer,
    copyAddress,
    optOut,
    optOutSponsored,
    changeRewardAddress,
    changeRewardAddressSponsored,
    isOptOutSubmitting,
    optOutStatus,
    optOutFunding,
    isChangeAddressSubmitting,
    changeAddressStatus,
    changeAddressFunding,
    isSubmittingSponsored,
  };
}
