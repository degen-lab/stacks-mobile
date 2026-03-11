import { principalCV, PostConditionMode } from "@stacks/transactions";
import { showMessage } from "react-native-flash-message";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { saveUnenrollmentReasons } from "@/api/dual-stacking/enrollment";
import { waitForTxSuccess } from "@/api/stacks/wait-for-tx-success";
import { copyToClipboard } from "@/lib/clipboard";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { walletKit } from "@/lib/stacks/wallet";
import { getExplorerUrl } from "@/lib/stacks/network";
import { useSelectedNetwork, useSettingsStore } from "@/lib/store/settings";
import { isValidPrincipal } from "@/lib/stacks/addresses";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import type { UnenrollReasonKey } from "@/api/dual-stacking/enrollment/save-unenrollment-reasons";
import {
  invalidateEnrollmentQueries,
  useTrackEnrollTx,
} from "@/features/dual-stacking/hooks/use-track-enroll-tx";

export function useWalletActions() {
  const queryClient = useQueryClient();
  const { selectedNetwork } = useSelectedNetwork();
  const { stxAddress } = useWalletAddresses();
  const [optOutTxId, setOptOutTxId] = useState<string | null>(null);
  const [isOptOutSubmitting, setIsOptOutSubmitting] = useState(false);
  const [optOutStatus, setOptOutStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const contractId = CONTRACTS[selectedNetwork][contractType];

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
      const txId = await walletKit.makeContractCall(
        contractId,
        SC_FUNCTIONS[contractType].publicFunctions.OPT_OUT,
        [],
        PostConditionMode.Allow,
        feeMicroStx,
        useSettingsStore.getState().activeAccountIndex,
      );

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
    if (!isValidPrincipal(value)) {
      showMessage({
        message: "Invalid address",
        description: "Please enter a valid Stacks principal.",
        type: "danger",
      });
      return false;
    }

    try {
      const txId = await walletKit.makeContractCall(
        contractId,
        SC_FUNCTIONS[contractType].publicFunctions.CHANGE_REWARDS_ADDRESS,
        [principalCV(value)],
        PostConditionMode.Allow,
        feeMicroStx,
        useSettingsStore.getState().activeAccountIndex,
      );

      if (!txId) {
        showMessage({
          message: "Update failed",
          description: "No transaction ID received. Please try again.",
          type: "danger",
        });
        return false;
      }

      showMessage({
        message: "Broadcasted",
        description: "Confirming on-chain...",
        type: "info",
      });

      const result = await waitForTxSuccess(txId);

      if (!result.ok) {
        showMessage({
          message: "Update failed",
          description:
            result.data?.tx_result?.repr ??
            "Unable to confirm the transaction. Please try again later.",
          type: "danger",
        });
        return false;
      }

      await queryClient.invalidateQueries({
        queryKey: [contractType, "GET_LATEST_REWARD_ADDRESS"],
      });

      showMessage({
        message: "Reward address updated",
        type: "success",
      });
      return true;
    } catch (error) {
      showMessage({
        message: "Update failed",
        description: String(error),
        type: "danger",
      });
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

  return {
    openInExplorer,
    copyAddress,
    optOut,
    changeRewardAddress,
    isOptOutSubmitting,
    optOutStatus,
  };
}
