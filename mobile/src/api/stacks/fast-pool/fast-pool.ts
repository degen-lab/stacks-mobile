import {
  principalCV,
  PostConditionMode,
  uintCV,
  noneCV,
} from "@stacks/transactions";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { IPoolService, PoolLockStatus } from "./types";
import { fetchReadOnly } from "@/api/stacks/read-only";
import { endpoints, fetchFromStacksApi } from "@/api/stacks/stacks-api";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { MobileClient } from "@degenlab/stacks-wallet-kit-mobile";
import { useSettingsStore } from "@/lib/store/settings";

type ContractCallerAllowance = null | { "until-burn-ht": null | bigint };
type StacksApiInfo = { burn_block_height: number };

export class FastPoolService implements IPoolService {
  constructor(
    private walletKit: MobileClient,
    private network: NetworkType,
  ) {}
  private get fastPoolContract() {
    return CONTRACTS[this.network].stackingFastPool;
  }

  private get poxContract() {
    return CONTRACTS[this.network].pox;
  }

  private get activeAccountIndex() {
    return useSettingsStore.getState().activeAccountIndex;
  }

  private getContractDetails(contractId: string) {
    const [address, name] = contractId.split(".");
    return { address, name };
  }

  private async getBurnBlockHeight(): Promise<bigint> {
    const info = await fetchFromStacksApi<StacksApiInfo>(endpoints.INFO);
    return BigInt(info.burn_block_height);
  }

  async getLockStatus(userAddress: string): Promise<PoolLockStatus> {
    const { address, name } = this.getContractDetails(this.fastPoolContract);

    try {
      const amount = await fetchReadOnly<number>(
        address,
        name,
        SC_FUNCTIONS.stackingFastPool.readOnlyFunctions.GET_DELEGATED_AMOUNT,
        [principalCV(userAddress)],
      );

      return {
        isLocked: amount > 0,
        lockedAmountMicroStx: amount,
      };
    } catch (error) {
      console.warn("[FastPool] Failed to fetch status:", error);
      return { isLocked: false, lockedAmountMicroStx: 0 };
    }
  }

  async isCallerAllowed(userAddress: string): Promise<boolean> {
    const { address, name } = this.getContractDetails(this.poxContract);

    try {
      const allowance = await fetchReadOnly<ContractCallerAllowance>(
        address,
        name,
        SC_FUNCTIONS.pox.readOnlyFunctions.GET_ALLOWANCE_CONTRACT_CALLERS,
        [principalCV(userAddress), principalCV(this.fastPoolContract)],
      );
      if (allowance === null) return false;

      const untilBurnHt = allowance["until-burn-ht"];
      if (untilBurnHt === null) return true;

      const burnHeight = await this.getBurnBlockHeight();
      return burnHeight < untilBurnHt;
    } catch (error) {
      console.warn("[FastPool] Failed to fetch allowance:", error);
      return false;
    }
  }

  async delegate(
    amountMicroStx: number,
    feeMicroStx?: number,
  ): Promise<string> {
    return this.walletKit.makeContractCall(
      this.fastPoolContract,
      SC_FUNCTIONS.stackingFastPool.publicFunctions.DELEGATE_STX,
      getDelegateArgs(amountMicroStx),
      PostConditionMode.Allow,
      feeMicroStx,
      this.activeAccountIndex,
    );
  }

  async revoke(feeMicroStx?: number): Promise<string> {
    return this.walletKit.makeContractCall(
      this.poxContract,
      SC_FUNCTIONS.pox.publicFunctions.REVOKE_DELEGATE_STX,
      [],
      PostConditionMode.Allow,
      feeMicroStx,
      this.activeAccountIndex,
    );
  }

  async allowContractCaller(feeMicroStx?: number): Promise<string> {
    return this.walletKit.makeContractCall(
      this.poxContract,
      SC_FUNCTIONS.pox.publicFunctions.ALLOW_CONTRACT_CALLER,
      getAllowanceArgs(this.fastPoolContract),
      PostConditionMode.Allow,
      feeMicroStx,
      this.activeAccountIndex,
    );
  }

  async disallowContractCaller(feeMicroStx?: number): Promise<string> {
    return this.walletKit.makeContractCall(
      this.poxContract,
      SC_FUNCTIONS.pox.publicFunctions.DISALLOW_CONTRACT_CALLER,
      getDisallowanceArgs(this.fastPoolContract),
      PostConditionMode.Allow,
      feeMicroStx,
      this.activeAccountIndex,
    );
  }
}

export const getDelegateArgs = (amountMicroStx: number) => {
  return [uintCV(amountMicroStx)];
};

export const getAllowanceArgs = (poolContractAddress: string) => {
  return [principalCV(poolContractAddress), noneCV()];
};

export const getDisallowanceArgs = (poolContractAddress: string) => {
  return [principalCV(poolContractAddress)];
};
