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

export const divisorNetwork = 1;
//  network === 'devnet' || network === 'testnet' ? 4
