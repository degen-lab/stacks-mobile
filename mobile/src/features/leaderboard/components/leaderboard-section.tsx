import { useReportUser } from "@/api/user/use-report-user";
import { useModal } from "@/components/ui/modal";
import type { LeaderboardUser } from "@/features/leaderboard/types";
import { useState } from "react";
import { LeaderboardList } from "./leaderboard-list";
import { Podium } from "./podium";
import {
  REASON_API_MAP,
  ReportUserSheet,
  type ReportReason,
} from "./report-user-sheet";

type LeaderboardSectionProps = {
  podiumUsers: LeaderboardUser[];
  leaderboardUsers: LeaderboardUser[];
  currentUserRank?: number | null;
};

export function LeaderboardSection({
  podiumUsers,
  leaderboardUsers,
  currentUserRank,
}: LeaderboardSectionProps) {
  const reportModal = useModal();
  const [reportTarget, setReportTarget] = useState<LeaderboardUser | null>(
    null,
  );
  const { mutate: reportUser } = useReportUser();

  const handleOpenReport = (user: LeaderboardUser) => {
    setReportTarget(user);
    reportModal.present();
  };

  const handleSubmitReport = (user: LeaderboardUser, reason: ReportReason) => {
    if (!user.userId) return;
    reportUser({
      reportedUserId: user.userId,
      reason: REASON_API_MAP[reason],
    });
  };

  return (
    <>
      <Podium users={podiumUsers} onReport={handleOpenReport} />
      <LeaderboardList
        users={leaderboardUsers}
        currentUserRank={currentUserRank}
        onReport={handleOpenReport}
      />
      <ReportUserSheet
        ref={reportModal.ref}
        user={reportTarget}
        onReport={handleSubmitReport}
        onClose={reportModal.dismiss}
      />
    </>
  );
}
