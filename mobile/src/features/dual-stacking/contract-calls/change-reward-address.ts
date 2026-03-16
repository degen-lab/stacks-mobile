import { PostConditionMode, principalCV } from "@stacks/transactions";

import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";
import { useSettingsStore } from "@/lib/store/settings";
import { walletKit } from "@/lib/stacks/wallet";
import { isValidPrincipal } from "@/lib/stacks/addresses";

export const contractChangeRewardsAddress = async (
  rewardAddress: string,
  feeMicroStx?: number,
): Promise<string | undefined> => {
  const normalizedAddress = rewardAddress?.trim();
  if (!isValidPrincipal(normalizedAddress)) {
    return undefined;
  }

  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const network = useSettingsStore.getState().network;
  const contractId = CONTRACTS[network][contractType];
  const functionName =
    SC_FUNCTIONS[contractType].publicFunctions.CHANGE_REWARDS_ADDRESS;

  const convertedArgs = [principalCV(normalizedAddress)];
  const accountIndex = useSettingsStore.getState().activeAccountIndex;

  return walletKit.makeContractCall(
    contractId,
    functionName,
    convertedArgs,
    PostConditionMode.Allow,
    feeMicroStx,
    accountIndex,
  );
};
