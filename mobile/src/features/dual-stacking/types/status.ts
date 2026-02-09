export enum Status {
  NotEnrolled = "not-enrolled",
  Enrolled = "enrolled",
  EnrolledNextCycle = "enrolled-next-cycle",
  NotBoosting = "not-boosting",
  BoostActive = "boost-active",
  MaxBoost = "max-boost",
}

export const mapEnrollmentToStatus = (
  enrolledThisCycle: boolean,
  enrolledNextCycle: boolean,
): Status => {
  if (enrolledThisCycle && enrolledNextCycle) {
    return Status.Enrolled;
  }

  if (!enrolledThisCycle && enrolledNextCycle) {
    return Status.EnrolledNextCycle;
  }

  return Status.NotEnrolled;
};
export const mapApyStatus = ({
  enrolledCurrentCycle,
  enrolledNextCycle,
  isStacking,
  isDeFiParticipant,
  totalApr,
  maxApr,
}: {
  enrolledCurrentCycle: boolean;
  enrolledNextCycle: boolean;
  isStacking: boolean;
  isDeFiParticipant: boolean;
  totalApr: number;
  maxApr: number;
}): Status => {
  if (!enrolledCurrentCycle && !enrolledNextCycle) return Status.NotEnrolled;
  if (!enrolledCurrentCycle && enrolledNextCycle)
    return Status.EnrolledNextCycle;
  if (totalApr >= maxApr) return Status.MaxBoost;
  if (isStacking || isDeFiParticipant) return Status.BoostActive;
  return Status.NotBoosting;
};
