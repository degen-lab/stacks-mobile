export interface PoolLockStatus {
  isLocked: boolean;
  lockedAmountMicroStx: number;
}

export interface IPoolService {
  allowContractCaller?(feeMicroStx?: number): Promise<string>;
  disallowContractCaller?(): Promise<string>;
  isCallerAllowed?(userAddress: string): Promise<boolean>;
  delegate(amountMicroStx: number, feeMicroStx?: number): Promise<string>;
  revoke(): Promise<string>;
  getLockStatus(userAddress: string): Promise<PoolLockStatus>;
}
