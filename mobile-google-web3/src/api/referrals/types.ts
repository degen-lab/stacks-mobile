export interface ActiveReferral {
  id: number;
  nickName: string;
  referralCode: string;
  points: number;
  streak: number;
  createdAt: string; // ISO date string
  lastStreakCompletionDate?: string; // ISO date string
}

export interface ActiveReferralsData {
  count: number;
  referrals: ActiveReferral[];
}

export interface ActiveReferralsSuccessResponse {
  success: true;
  message: string;
  data: ActiveReferralsData;
}

export interface ActiveReferralsErrorResponse {
  success: false;
  message: string;
}

export type ActiveReferralsResponse =
  | ActiveReferralsSuccessResponse
  | ActiveReferralsErrorResponse;
