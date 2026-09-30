import { MS_PER_DAY } from "@/lib/format/date";

const MINUTES_PER_DAY = MS_PER_DAY / (60 * 1000);

export type TimeUntil = {
  days: number;
  hours: number;
  minutes: number;
};

export function formatTimeUntil(timeUntil: TimeUntil) {
  if (timeUntil.days > 0) {
    return `${timeUntil.days}d ${timeUntil.hours}h`;
  }

  if (timeUntil.hours > 0) {
    return `${timeUntil.hours}h ${timeUntil.minutes}m`;
  }

  return `${Math.max(0, timeUntil.minutes)} mins`;
}

/** Splits wall-clock ms until target into days, hours and minutes. */
function msUntilToDayParts(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / (60 * 1000)));
  return {
    days: Math.floor(totalMinutes / MINUTES_PER_DAY),
    hours: Math.floor((totalMinutes % MINUTES_PER_DAY) / 60),
    minutes: Math.floor(totalMinutes % 60),
  };
}

/**
 * If the target is at least ~1 day away: calendar date only.
 * If under 1 day: relative time ({@link formatTimeUntil}).
 */
export function formatLockedUntilLabel(target: Date, now = Date.now()): string {
  const msUntil = target.getTime() - now;
  if (msUntil >= MS_PER_DAY) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(target);
  }
  if (msUntil > 0) {
    return formatTimeUntil(msUntilToDayParts(msUntil));
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(target);
}
