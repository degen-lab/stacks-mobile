import { TestIds } from "react-native-google-mobile-ads";

import { Env } from "@/lib/env";

export function getRewardedAdUnitId() {
  return Env.APP_ENV === "production"
    ? Env.ANDROID_REWARDS_AD_MOBIN_KEY
    : TestIds.REWARDED;
}
