import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

import { Env } from "@/lib/env";

export function getRewardedAdUnitId() {
  if (Env.APP_ENV !== "production") {
    return TestIds.REWARDED;
  }

  return Platform.OS === "ios"
    ? Env.IOS_REWARDS_AD_MOBIN_KEY
    : Env.ANDROID_REWARDS_AD_MOBIN_KEY;
}
