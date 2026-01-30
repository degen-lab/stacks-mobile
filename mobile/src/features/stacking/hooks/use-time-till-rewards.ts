import { useMemo } from "react";
import { PoxInfo } from "@/api/stacks/types/pox-info";

const AVERAGE_BLOCK_DURATION_SECONDS = 600; // 10 minutes

export function useTimeTillRewards(poxInfo?: PoxInfo) {
  return useMemo(() => {
    if (!poxInfo) {
      return {
        timeTillNextCycle: "--",
        nextCycleDate: null,
      };
    }

    const blocksUntil = poxInfo.next_cycle.blocks_until_reward_phase;
    const totalSeconds = blocksUntil * AVERAGE_BLOCK_DURATION_SECONDS;
    const nextCycleDate = new Date(Date.now() + totalSeconds * 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let timeTillNextCycle = "";

    if (days > 0) {
      timeTillNextCycle = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeTillNextCycle = `${hours}h ${minutes}m`;
    } else {
      timeTillNextCycle = `${minutes} mins`;
    }

    return {
      timeTillNextCycle,
      nextCycleDate,
    };
  }, [poxInfo]);
}
