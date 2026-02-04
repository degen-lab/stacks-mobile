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
      txStatus: string;
      rewardedStxAmount: number | null;
    };
  };
};
