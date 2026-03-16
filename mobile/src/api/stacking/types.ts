export type SaveStackingDataRequest = {
  txId: string;
  poolName: string;
};

export type SaveStackingDataResponse = {
  success: boolean;
  message: string;
  data?: {
    stackingData: {
      id: number;
      txId: string;
      poolName: string;
      poolStxAddress: string;
      userStxAddress: string;
      amountOfStxStacked: number;
      startCycleId: number;
      endCycleId: number | null;
      poxAddress: string | null;
      txStatus: string | number | null;
      rewardedStxAmount: number | null;
    };
  };
};

export type UserStackingDataRow = {
  id: number;
  txId: string;
  poolName: string;
  poolStxAddress: string;
  userStxAddress: string;
  amountOfStxStacked: number | string;
  startCycleId: number;
  endCycleId: number | null;
  poxAddress: string | null;
  txStatus: string | number | null | undefined;
  rewardedStxAmount: number | string | null;
};

export type UserStackingDataResponse = {
  success: boolean;
  message?: string;
  data?: UserStackingDataRow[];
};
