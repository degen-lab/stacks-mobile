import { dualStackingClient } from "@/api/common/backend-client";

export const UNENROLL_REASON_LABEL = {
  notGoodEnough: "Rewards aren't good enough",
  tryingOut: "I was just trying it out",
  dontUnderstand: "I couldn't understand how it works",
  differentAccount: "I want to enroll with a different account",
} as const;

export type UnenrollReasonKey = keyof typeof UNENROLL_REASON_LABEL;

export const INITIAL_UNENROLL_REASONS = Object.keys(
  UNENROLL_REASON_LABEL,
).reduce(
  (acc, key) => {
    acc[key as UnenrollReasonKey] = false;
    return acc;
  },
  {} as Record<UnenrollReasonKey, boolean>,
);

export async function saveUnenrollmentReasons(
  address: string,
  reasons: UnenrollReasonKey[],
) {
  if (!address || reasons.length === 0) return;

  const reason = reasons.map((item) => UNENROLL_REASON_LABEL[item]).join(",");

  await dualStackingClient.get("/save-unenrollment", {
    params: { address, reason },
  });
}
