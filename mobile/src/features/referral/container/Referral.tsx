import { Linking, Share } from "react-native";

import ReferralLayout, {
  InvitedPlayer,
  ReferralStats,
} from "./Referral.layout";

import { useActiveReferrals } from "@/api/referrals/use-active-referrals";
import {
  buildShareMessage,
  socialShareTargets,
} from "@/features/referral/utils/social-share";
import { useI18nSettings } from "@/hooks/use-i18n-settings";
import { formatFriendlyDate, isToday } from "@/lib/format/date";
import { useAuth } from "@/lib/store/auth";

export default function ReferralContainer() {
  const { backendUserData } = useAuth();
  const { data } = useActiveReferrals();
  const { locale, timeZone } = useI18nSettings();

  const referralCode = backendUserData?.referralCode ?? "";
  const hasReferralCode = Boolean(referralCode);

  const invitedPlayers: InvitedPlayer[] = (data?.referrals || []).map(
    (referral) => ({
      id: referral.id,
      nickname: referral.nickName,
      joinedAt: formatFriendlyDate(referral.createdAt, { locale, timeZone }),
      isActive: isToday(referral.lastStreakCompletionDate, { timeZone }),
      pointsEarned: referral.points,
    }),
  );

  const stats: ReferralStats = {
    totalInvites: data?.count || invitedPlayers.length,
    activeInvites: invitedPlayers.filter((p) => p.isActive).length,
    pointsEarned: invitedPlayers.reduce((sum, p) => sum + p.pointsEarned, 0),
  };

  const handleShare = async () => {
    if (!hasReferralCode) return;

    try {
      await Share.share({ message: buildShareMessage(referralCode) });
    } catch (error) {
      console.error("Share failed", error);
    }
  };

  const handleSocialShare = async (channel: "x" | "telegram" | "whatsapp") => {
    if (!hasReferralCode) return;

    const message = buildShareMessage(referralCode);
    const shareTargets = socialShareTargets(message);

    try {
      const url = shareTargets[channel];
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        await handleShare();
      }
    } catch {
      await handleShare();
    }
  };

  return (
    <ReferralLayout
      referralCode={referralCode}
      hasReferralCode={hasReferralCode}
      stats={stats}
      invitedPlayers={invitedPlayers}
      onShare={handleShare}
      onShareChannel={handleSocialShare}
    />
  );
}
