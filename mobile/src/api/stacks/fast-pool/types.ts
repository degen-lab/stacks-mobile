export interface PoolLockStatus {
  isLocked: boolean;
  lockedAmountMicroStx: number;
}

export interface IPoolService {
  allowContractCaller?(feeMicroStx?: number): Promise<string>;
  disallowContractCaller?(feeMicroStx?: number): Promise<string>;
  isCallerAllowed?(userAddress: string): Promise<boolean>;
  delegate(amountMicroStx: number, feeMicroStx?: number): Promise<string>;
  revoke(feeMicroStx?: number): Promise<string>;
  getLockStatus(userAddress: string): Promise<PoolLockStatus>;
}
