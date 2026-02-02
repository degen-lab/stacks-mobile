import { useMemo } from "react";
import { PoxInfo } from "@/api/stacks/types/pox-info";
import { AVERAGE_BLOCK_DURATION_SECONDS } from "@/lib/format/date";

export function useTimeTillRewards(poxInfo?: PoxInfo) {
  return useMemo(() => {
    if (!poxInfo) {
      return {
        timeTillNextCycle: "--",
        nextCycleDate: undefined,
        timeTillRewardPhase: "--",
        nextRewardPhaseDate: undefined,
        blocksUntilRewardPhase: 0,
        inPreparePhase: false,
        timeTillPreparePhase: "--",
      };
    }

    const blocksUntilPrepare = poxInfo.next_cycle.blocks_until_prepare_phase;
    const totalSecondsPrepare =
      blocksUntilPrepare * AVERAGE_BLOCK_DURATION_SECONDS;
    const nextCycleDate = new Date(Date.now() + totalSecondsPrepare * 1000);

    const blocksUntilReward = poxInfo.next_cycle.blocks_until_reward_phase;
    const totalSecondsReward =
      blocksUntilReward * AVERAGE_BLOCK_DURATION_SECONDS;
    const nextRewardPhaseDate = new Date(
      Date.now() + totalSecondsReward * 1000,
    );

    const days = Math.floor(totalSecondsPrepare / (24 * 3600));
    const hours = Math.floor((totalSecondsPrepare % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSecondsPrepare % 3600) / 60);

    let timeTillNextCycle = "";
    if (days > 0) {
      timeTillNextCycle = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeTillNextCycle = `${hours}h ${minutes}m`;
    } else {
      timeTillNextCycle = `${minutes} mins`;
    }
    const daysReward = Math.floor(totalSecondsReward / (24 * 3600));
    const hoursReward = Math.floor((totalSecondsReward % (24 * 3600)) / 3600);
    const minutesReward = Math.floor((totalSecondsReward % 3600) / 60);

    let timeTillRewardPhase = "";
    if (daysReward > 0) {
      timeTillRewardPhase = `${daysReward}d ${hoursReward}h`;
    } else if (hoursReward > 0) {
      timeTillRewardPhase = `${hoursReward}h ${minutesReward}m`;
    } else {
      timeTillRewardPhase = `${minutesReward} mins`;
    }
    const inPreparePhase = blocksUntilPrepare <= 0 && blocksUntilReward > 0;

    let timeTillPreparePhase = "";
    if (blocksUntilPrepare > 0) {
      const daysPrepare = Math.floor(totalSecondsPrepare / (24 * 3600));
      const hoursPrepare = Math.floor(
        (totalSecondsPrepare % (24 * 3600)) / 3600,
      );
      const minutesPrepare = Math.floor((totalSecondsPrepare % 3600) / 60);

      if (daysPrepare > 0) {
        timeTillPreparePhase = `${daysPrepare}d ${hoursPrepare}h`;
      } else if (hoursPrepare > 0) {
        timeTillPreparePhase = `${hoursPrepare}h ${minutesPrepare}m`;
      } else {
        timeTillPreparePhase = `${minutesPrepare} mins`;
      }
    }

    return {
      timeTillNextCycle,
      nextCycleDate,
      timeTillRewardPhase,
      nextRewardPhaseDate,
      blocksUntilRewardPhase: blocksUntilReward,
      inPreparePhase,
      timeTillPreparePhase,
    };
  }, [poxInfo]);
}
