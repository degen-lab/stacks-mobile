import { cvToHex, falseCV, principalCV, tupleCV } from "@stacks/transactions";

import { principalHexFromAddress } from "./addresses";

export const MAX_APR = 4.5;
export const BASE_APR = MAX_APR * 0.1; // this should also come from project rewards cause can be different

export const CURRENT_MIGRATION_ID = 1;
export const FUTURE_MIGRATION_ID = 2;

export const getContractTypeForCycle = (
  selectedCycle: number,
): "yield" | "yieldV2" => {
  return selectedCycle < 2 ? "yield" : "yieldV2";
};

export const getContractDetails = (contractId: string) => {
  const [address, name] = contractId.split(".");
  return { address, name };
};

export const meetsMinimumEnrollmentReadOnlyArgs = (
  walletAddress: string | null | undefined,
  migrationCycleId: number = CURRENT_MIGRATION_ID,
): string[] => {
  if (!walletAddress) return [];

  const contractType = getContractTypeForCycle(migrationCycleId);
  if (contractType === "yieldV2") {
    return [principalHexFromAddress(walletAddress)];
  }

  return [
    cvToHex(
      tupleCV({
        address: principalCV(walletAddress),
        arkadiko: falseCV(),
        "based-dollar": falseCV(),
        bitflow: falseCV(),
        granite: falseCV(),
        velar: falseCV(),
        zest: falseCV(),
      }),
    ),
  ];
};

export const divisorNetwork = 1;
//  network === 'devnet' || network === 'testnet' ? 4
