export type UserData = {
  id: number;
  nickname: string;
  referralCode: string;
  streak: number;
  points: number;
};

export type AuthRequest = {
  googleId: string;
  nickName: string;
  photoUri?: string;
  referralCode?: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  token: string;
  data: UserData;
};
