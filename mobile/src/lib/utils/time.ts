import { AVERAGE_BLOCK_DURATION_SECONDS, MS_PER_DAY } from "@/lib/format/date";

const MINUTES_PER_BLOCK = AVERAGE_BLOCK_DURATION_SECONDS / 60;
const MINUTES_PER_DAY = MS_PER_DAY / (60 * 1000);

export type TimeUntil = {
  days: number;
  hours: number;
  minutes: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
};

export function blocksToTime(
  blocksRemaining: number,
  minutesPerBlock = MINUTES_PER_BLOCK,
): TimeUntil {
  const safeBlocks = Math.max(0, blocksRemaining);
  const totalMinutes = safeBlocks * minutesPerBlock;

  return {
    days: Math.floor(totalMinutes / MINUTES_PER_DAY),
    hours: Math.floor((totalMinutes % MINUTES_PER_DAY) / 60),
    minutes: Math.floor(totalMinutes % 60),
    totalDays: Math.floor(totalMinutes / MINUTES_PER_DAY),
    totalHours: Math.floor(totalMinutes / 60),
    totalMinutes,
  };
}

export function formatTimeUntil(
  timeUntil: Pick<TimeUntil, "days" | "hours" | "minutes">,
) {
  if (timeUntil.days > 0) {
    return `${timeUntil.days}d ${timeUntil.hours}h`;
  }

  if (timeUntil.hours > 0) {
    return `${timeUntil.hours}h ${timeUntil.minutes}m`;
  }

  return `${Math.max(0, timeUntil.minutes)} mins`;
}

export function timeUntilBlock(
  currentHeight: number | bigint,
  targetHeight: number | bigint,
  minutesPerBlock = MINUTES_PER_BLOCK,
) {
  const blocksRemaining = Number(targetHeight) - Number(currentHeight);
  const safeBlocksRemaining = Math.max(
    0,
    Number.isFinite(blocksRemaining) ? blocksRemaining : 0,
  );

  return {
    blocksRemaining: safeBlocksRemaining,
    timeUntil: blocksToTime(safeBlocksRemaining, minutesPerBlock),
  };
}

export function isInDistributionWindow(
  currentHeight: number | bigint,
  bufferStartBlock?: number | bigint,
  bufferBlocks?: number | bigint,
) {
  if (bufferStartBlock == null || bufferBlocks == null) return false;

  const start = Number(bufferStartBlock) + Number(bufferBlocks);
  return Number(currentHeight) >= start;
}
