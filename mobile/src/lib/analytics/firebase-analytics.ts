import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperties,
} from "@react-native-firebase/analytics";

export async function firebaseSetEnabled(enabled: boolean) {
  await setAnalyticsCollectionEnabled(getAnalytics(), enabled);
}

export async function firebaseTrackScreen(screenName: string) {
  await logEvent(getAnalytics(), "screen_view", {
    screen_name: screenName,
    screen_class: screenName,
  });
}

export async function firebaseLogEvent(
  name: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  await logEvent(getAnalytics(), name, params);
}

export async function firebaseSetUserContext(
  userId: string,
  properties: Record<string, string>,
) {
  await setUserId(getAnalytics(), userId);
  await setUserProperties(getAnalytics(), properties);
}

export async function firebaseClearUserContext(
  properties: Record<string, null>,
) {
  await setUserId(getAnalytics(), null);
  await setUserProperties(getAnalytics(), properties);
}
