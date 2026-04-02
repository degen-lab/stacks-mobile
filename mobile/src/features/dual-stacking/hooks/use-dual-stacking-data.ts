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
  return data.reduce<number | undefined>((maxCycle, item) => {
    const cycleId = Number(item.cycle_id);
    if (!Number.isFinite(cycleId)) return maxCycle;
    return maxCycle === undefined || cycleId > maxCycle ? cycleId : maxCycle;
  }, undefined);
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
