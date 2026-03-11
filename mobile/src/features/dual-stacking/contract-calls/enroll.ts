import {
  noneCV,
  PostConditionMode,
  principalCV,
  someCV,
} from "@stacks/transactions";

import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";
import { useSettingsStore } from "@/lib/store/settings";
import { walletKit } from "@/lib/stacks/wallet";

export const contractEnroll = async (
  rewardsAddress?: string,
  feeMicroStx?: number,
): Promise<string | undefined> => {
  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const network = useSettingsStore.getState().network;
  const contractId = CONTRACTS[network][contractType];
  const enrollFunction = SC_FUNCTIONS[contractType].publicFunctions.ENROLL;
  const accountIndex = useSettingsStore.getState().activeAccountIndex;

  const hasRewardAddress =
    typeof rewardsAddress === "string" && rewardsAddress.trim().length > 0;

  const convertedArgs = hasRewardAddress
    ? [someCV(principalCV(rewardsAddress))]
    : [noneCV()];

  return walletKit.makeContractCall(
    contractId,
    enrollFunction,
    convertedArgs,
    PostConditionMode.Allow,
    feeMicroStx,
    accountIndex,
  );
};
