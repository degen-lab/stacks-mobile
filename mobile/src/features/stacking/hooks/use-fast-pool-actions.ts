import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { showMessage } from "react-native-flash-message";
import { PostConditionMode, type ClarityValue } from "@stacks/transactions";

import { trackEvent } from "@/lib/analytics";

import {
  getAllowanceArgs,
  getDelegateArgs,
  getDisallowanceArgs,
} from "@/api/stacks/fast-pool/fast-pool";
import { useFastPool } from "@/api/stacks/fast-pool/use-fast-pool";
import { useSponsoredStacksTransaction } from "@/hooks/use-sponsored-stacks-transaction";
import { getActiveWalletAccount } from "@/lib/stacks/active-account";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { buildUnsignedContractCall } from "@/lib/stacks/transaction-builder";
import { useSelectedNetwork } from "@/lib/store/settings";

type SponsoredContractCallArgs = {
  contractId: string;
  functionName: string;
  functionArgs: ClarityValue[];
  feeMicroStx?: number;
};

export function useFastPoolActions(userAddress?: string) {
  const queryClient = useQueryClient();
  const { selectedNetwork } = useSelectedNetwork();
  const fastPool = useFastPool(userAddress);
  const { revokeAsync, disallowAsync } = fastPool;
  const { submitSponsoredTransaction, isSubmittingSponsored } =
    useSponsoredStacksTransaction();

  const poolContract = CONTRACTS[selectedNetwork].stackingFastPool;
  const poxContract = CONTRACTS[selectedNetwork].pox;

  const invalidateFastPoolState = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["stacking-status"] });
    void queryClient.invalidateQueries({ queryKey: ["stacking-allowance"] });
    void queryClient.invalidateQueries({ queryKey: ["stacks-user-balances"] });
  }, [queryClient]);

  const sponsorContractCall = useCallback(
    async ({
      contractId,
      functionName,
      functionArgs,
      feeMicroStx,
    }: SponsoredContractCallArgs) => {
      const { account, accountIndex, address } = await getActiveWalletAccount();
      const unsignedSerializedTx = await buildUnsignedContractCall({
        contractId,
        functionName,
        functionArgs,
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
    },
    [selectedNetwork, submitSponsoredTransaction],
  );

  const revokeDelegation = useCallback(
    async (feeMicroStx?: number) => {
      try {
        await revokeAsync(feeMicroStx);
        void trackEvent("stacking_revoked");
        return true;
      } catch (error) {
        console.error("Failed to revoke delegation:", error);
        return false;
      }
    },
    [revokeAsync],
  );

  const revokeDelegationSponsored = useCallback(
    async (feeMicroStx?: number) => {
      try {
        await sponsorContractCall({
          contractId: poxContract,
          functionName: SC_FUNCTIONS.pox.publicFunctions.REVOKE_DELEGATE_STX,
          functionArgs: [],
          feeMicroStx,
        });
        invalidateFastPoolState();
        showMessage({
          message: "Revocation queued",
          description: "Your sponsored revocation will be broadcast shortly.",
          type: "success",
        });
        void trackEvent("stacking_revoked");
        return true;
      } catch (error) {
        console.error("Failed to sponsor delegation revocation:", error);
        return false;
      }
    },
    [invalidateFastPoolState, poxContract, sponsorContractCall],
  );

  const disallowPoolPermission = useCallback(
    async (feeMicroStx?: number) => {
      try {
        await disallowAsync(feeMicroStx);
        void trackEvent("stacking_disallowed");
        return true;
      } catch (error) {
        console.error("Failed to remove Fast Pool permission:", error);
        return false;
      }
    },
    [disallowAsync],
  );

  const disallowPoolPermissionSponsored = useCallback(
    async (feeMicroStx?: number) => {
      try {
        await sponsorContractCall({
          contractId: poxContract,
          functionName:
            SC_FUNCTIONS.pox.publicFunctions.DISALLOW_CONTRACT_CALLER,
          functionArgs: getDisallowanceArgs(poolContract),
          feeMicroStx,
        });
        invalidateFastPoolState();
        showMessage({
          message: "Permission removal queued",
          description:
            "Your sponsored disallow transaction will be broadcast shortly.",
          type: "success",
        });
        void trackEvent("stacking_disallowed");
        return true;
      } catch (error) {
        console.error("Failed to sponsor Fast Pool permission removal:", error);
        return false;
      }
    },
    [invalidateFastPoolState, poolContract, poxContract, sponsorContractCall],
  );

  const approvePoolSponsored = useCallback(
    async (feeMicroStx?: number) => {
      await sponsorContractCall({
        contractId: poxContract,
        functionName: SC_FUNCTIONS.pox.publicFunctions.ALLOW_CONTRACT_CALLER,
        functionArgs: getAllowanceArgs(poolContract),
        feeMicroStx,
      });
      invalidateFastPoolState();
      void trackEvent("stacking_approve_contract_caller");
    },
    [invalidateFastPoolState, poolContract, poxContract, sponsorContractCall],
  );

  const delegateStxSponsored = useCallback(
    async (amountMicroStx: number, feeMicroStx?: number) => {
      await sponsorContractCall({
        contractId: poolContract,
        functionName:
          SC_FUNCTIONS.stackingFastPool.publicFunctions.DELEGATE_STX,
        functionArgs: getDelegateArgs(amountMicroStx),
        feeMicroStx,
      });
      invalidateFastPoolState();
      void trackEvent("stacking_stx_delegated", {
        amount_micro_stx: amountMicroStx,
      });
    },
    [invalidateFastPoolState, poolContract, sponsorContractCall],
  );

  return {
    ...fastPool,
    selectedNetwork,
    poolContract,
    poxContract,
    isSubmittingSponsored,
    invalidateFastPoolState,
    approvePoolSponsored,
    delegateStxSponsored,
    revokeDelegation,
    revokeDelegationSponsored,
    disallowPoolPermission,
    disallowPoolPermissionSponsored,
  };
}
