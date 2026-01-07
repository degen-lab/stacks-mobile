const MS_PER_DAY = 86_400_000;

type DateOptions = {
  locale?: string;
  timeZone?: string;
};

const getDefaults = (): Required<DateOptions> => {
  const { locale = "en-US", timeZone } =
    Intl.DateTimeFormat().resolvedOptions();
  return { locale, timeZone: timeZone ?? "UTC" };
};

const safeDate = (value?: string | Date): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const isoDayKey = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
};

export const isToday = (value?: string | Date, opts?: DateOptions) => {
  const date = safeDate(value);
  if (!date) return false;
  const { timeZone } = { ...getDefaults(), ...opts };
  const todayKey = isoDayKey(new Date(), timeZone);
  const targetKey = isoDayKey(date, timeZone);
  return Boolean(todayKey && targetKey && todayKey === targetKey);
};

export const formatDate = (
  value?: string | Date,
  opts?: DateOptions,
  formatterOptions?: Intl.DateTimeFormatOptions,
) => {
  const date = safeDate(value);
  if (!date) return "";
  const { locale, timeZone } = { ...getDefaults(), ...opts };

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...formatterOptions,
  }).format(date);
};

export const formatFriendlyDate = (
  value?: string | Date,
  opts?: DateOptions,
) => {
  const date = safeDate(value);
  if (!date) return "";

  const { locale, timeZone } = { ...getDefaults(), ...opts };

  const todayKey = isoDayKey(new Date(), timeZone);
  const targetKey = isoDayKey(date, timeZone);

  if (todayKey && targetKey) {
    const toUtcMs = (key: string) => Date.parse(`${key}T00:00:00Z`);
    const diffDays = Math.round(
      (toUtcMs(todayKey) - toUtcMs(targetKey)) / MS_PER_DAY,
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays < 30) return `${diffDays} days ago`;
  }

  return formatDate(date, { locale, timeZone });
};

export type StreakDay = {
  id: string;
  label: string;
  completed: boolean;
};

export const getTimeUntilNextDay = (): string => {
  const now = new Date();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 1) {
    return `${minutes} Minutes left`;
  }

  return `${hours} Hours left`;
};

export const calculateStreakDays = (
  streak: number,
  lastCompletionDate?: string | null,
): StreakDay[] => {
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const dayIds = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  if (streak === 0) {
    return dayLabels.map((label, index) => ({
      id: dayIds[index],
      label,
      completed: false,
    }));
  }

  const completedToday = isToday(
    lastCompletionDate ? lastCompletionDate : undefined,
  );
  const daysToMark = Math.min(streak, 7);

  // Get current day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  // Convert to Monday = 0, Tuesday = 1, ..., Sunday = 6
  const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  return dayLabels.map((label, index) => {
    // Calculate days ago: 0 = today, 1 = yesterday, etc.
    const daysAgo =
      index <= mondayBasedDay
        ? mondayBasedDay - index
        : 7 - (index - mondayBasedDay);

    // Mark as completed if within the streak range
    const isCompleted = completedToday
      ? daysAgo < daysToMark
      : daysAgo > 0 && daysAgo <= daysToMark;

    return {
      id: dayIds[index],
      label,
      completed: isCompleted,
    };
  });
};
