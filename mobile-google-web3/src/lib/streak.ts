export type StreakInput = {
  streak: number;
  currentProgress?: number;
  targetProgress?: number;
  maxBoost?: number; // percent cap, e.g. 50
};

export type StreakStats = {
  boostPercentage: number;
  progressPercentage?: number;
  completedDaysThisWeek: number; // 0-7
  weekDays: boolean[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function calculateStreakStats({
  streak,
  currentProgress = 0,
  targetProgress = 7,
  maxBoost = 50,
}: StreakInput): StreakStats {
  const safeTarget = Math.max(targetProgress, 1);

  const normalizedBoost = Math.min(0.5, Math.log(streak + 1) / 7);
  const boostPercentage = Number((normalizedBoost * 100).toFixed(1));

  const progressPercentage = clamp(
    (currentProgress / safeTarget) * 100,
    0,
    100,
  );

  const completedDaysThisWeek = Math.min(streak === 0 ? 0 : streak % 7 || 7, 7);
  const weekDays = Array.from(
    { length: 7 },
    (_, index) => index < completedDaysThisWeek,
  );

  return {
    boostPercentage,
    progressPercentage,
    completedDaysThisWeek,
    weekDays,
  };
}
