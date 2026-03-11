import { showMessage } from "react-native-flash-message";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { saveUnenrollmentReasons } from "@/api/dual-stacking/enrollment";
import { copyToClipboard } from "@/lib/clipboard";
import { getExplorerUrl } from "@/lib/stacks/network";
import { isValidPrincipal } from "@/lib/stacks/addresses";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";
import {
  contractChangeRewardsAddress,
  contractOptOut,
} from "@/features/dual-stacking/contract-calls";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import type { UnenrollReasonKey } from "@/api/dual-stacking/enrollment/save-unenrollment-reasons";
import {
  invalidateEnrollmentQueries,
  useTrackEnrollTx,
} from "@/features/dual-stacking/hooks/use-track-enroll-tx";

export function useWalletActions() {
  const queryClient = useQueryClient();
  const { stxAddress } = useWalletAddresses();
  const [optOutTxId, setOptOutTxId] = useState<string | null>(null);
  const [isOptOutSubmitting, setIsOptOutSubmitting] = useState(false);
  const [optOutStatus, setOptOutStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [changeAddressTxId, setChangeAddressTxId] = useState<string | null>(
    null,
  );
  const [isChangeAddressSubmitting, setIsChangeAddressSubmitting] =
    useState(false);
  const [changeAddressStatus, setChangeAddressStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);

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
      const txId = await contractOptOut(feeMicroStx);

      if (!txId) {
        setIsOptOutSubmitting(false);
        setOptOutStatus("error");
        showMessage({
          message: "Opt-out failed",
          description: "No transaction ID received. Please try again.",
          type: "danger",
        });
        return false;
      }

      if (reasons.length > 0) {
        try {
          await saveUnenrollmentReasons(stxAddress, reasons);
        } catch (error) {
          console.warn("Failed to save unenrollment reasons", error);
        }
      }

      setOptOutTxId(txId);
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
      const txId = await contractChangeRewardsAddress(value, feeMicroStx);

      if (!txId) {
        setIsChangeAddressSubmitting(false);
        setChangeAddressStatus("error");
        return false;
      }

      setChangeAddressTxId(txId);
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
      invalidateEnrollmentQueries(queryClient);
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
      void queryClient.invalidateQueries({
        queryKey: [contractType, "GET_LATEST_REWARD_ADDRESS"],
      });
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
    changeRewardAddress,
    isOptOutSubmitting,
    optOutStatus,
    isChangeAddressSubmitting,
    changeAddressStatus,
  };
}
