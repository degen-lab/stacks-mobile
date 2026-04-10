import type { PurchaseType } from "@/lib/enums";
import { ItemVariant } from "@/lib/enums";
import type { ConsentDto } from "@/lib/consent/types";

export type UserItem = {
  id: number;
  type: number; // Backend returns 0 (Power-Up) or 1 (Skin)
  name: string;
  description?: string; // Optional in backend response
  purchaseType: PurchaseType;
  quantity?: number;
  pointsPerUnit?: number;
  pointsSpent?: number;
  metadata?: Record<string, unknown>;
};

const ITEM_VARIANTS = new Set<string>(Object.values(ItemVariant));

export function getItemVariant(item: UserItem): ItemVariant | null {
  const variant = item.metadata?.variant;
  if (typeof variant !== "string") return null;
  if (!ITEM_VARIANTS.has(variant)) return null;
  return variant as ItemVariant;
}

export type UserProfile = {
  id: number;
  nickname: string;
  photoUri?: string | null;
  referralCode: string;
  streak: number;
  points: number;
  createdAt: string; // ISO string
  lastStreakCompletionDate: string | null; // ISO string or null
  items?: UserItem[];
  itemsCount: number;
  consent: ConsentDto;
};

export type UserProfileApiResponse = {
  success: boolean;
  message: string;
  data?: UserProfile;
};

export type SponsoredSubmissionsLeft = {
  dailyRaffleSubmissionsLeft: number;
  dailyWeeklyContestSubmissionsLeft: number;
};

export type SponsoredSubmissionsLeftApiResponse = {
  success: boolean;
  message: string;
  data: SponsoredSubmissionsLeft;
};

export type IsNewUserData = {
  isNewUser: boolean;
};

export type IsNewUserApiResponse = {
  success: boolean;
  message: string;
  data: IsNewUserData;
};

export type UpdateUserConsentRequest = {
  analytics: boolean;
  adsPersonalization: boolean;
  version: string;
};

export type UpdateUserConsentApiResponse = {
  success: boolean;
  message: string;
  data: ConsentDto;
};

export type DeleteAccountApiResponse = {
  success: boolean;
  message: string;
};
