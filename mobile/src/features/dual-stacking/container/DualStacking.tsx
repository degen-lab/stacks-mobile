import { useEnrollmentStatus } from "../hooks/use-enrollment-status";
import DualStackingLayout from "./DualStacking.layout";

export default function DualStacking() {
  const { enrolledNextCycle } = useEnrollmentStatus();
  return <DualStackingLayout isEnrolledNextCycle={enrolledNextCycle} />;
}
