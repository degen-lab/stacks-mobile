import { PostConditionMode } from "@stacks/transactions";

import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";
import { useSettingsStore } from "@/lib/store/settings";
import { walletKit } from "@/lib/stacks/wallet";
import { trackEvent } from "@/lib/analytics";

export const contractOptOut = async (
  feeMicroStx?: number,
): Promise<string | undefined> => {
  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const network = useSettingsStore.getState().network;
  const contractId = CONTRACTS[network][contractType];
  const functionName = SC_FUNCTIONS[contractType].publicFunctions.OPT_OUT;
  const accountIndex = useSettingsStore.getState().activeAccountIndex;

  const txId = await walletKit.makeContractCall(
    contractId,
    functionName,
    [],
    PostConditionMode.Allow,
    feeMicroStx,
    accountIndex,
  );
  void trackEvent("dual_stacking_opted_out");
  return txId;
};
