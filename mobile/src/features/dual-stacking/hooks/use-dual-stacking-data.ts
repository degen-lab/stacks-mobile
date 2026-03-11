import {
  DualStackingDataResponse,
  useDualStackingData,
} from "@/api/dual-stacking";

type UseDualStackingDataLatestCycle = {
  dualStackingData?: DualStackingDataResponse;
  cycle?: number;
  dualStackingDataLoading: boolean;
  dualStackingDataError: boolean;
};

const getLatestCycle = (data?: DualStackingDataResponse) => {
  if (!Array.isArray(data) || data.length === 0) return undefined;
  return Math.max(...data.map((item) => item.cycle_id));
};

export const useDualStackingDataWithLatestCycle =
  (): UseDualStackingDataLatestCycle => {
    const {
      isLoading: dualStackingDataLoading,
      isError: dualStackingDataError,
      data: dualStackingData,
    } = useDualStackingData({
      select: (data) => ({
        data,
        latestCycle: getLatestCycle(data),
      }),
    });

    return {
      dualStackingData: dualStackingData?.data,
      cycle: dualStackingData?.latestCycle,
      dualStackingDataLoading,
      dualStackingDataError,
    };
  };
