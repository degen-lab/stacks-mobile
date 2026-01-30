export interface PoolLockStatus {
  isLocked: boolean;
  lockedAmountMicroStx: number;
}

export interface IPoolService {
  allowContractCaller?(): Promise<string>;
  disallowContractCaller?(): Promise<string>;
  isCallerAllowed?(userAddress: string): Promise<boolean>;
  delegate(amountMicroStx: number): Promise<string>;
  revoke(): Promise<string>;
  getLockStatus(userAddress: string): Promise<PoolLockStatus>;
}
