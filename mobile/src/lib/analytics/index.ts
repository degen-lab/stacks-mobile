import {
  firebaseClearUserContext,
  firebaseLogEvent,
  firebaseSetEnabled,
  firebaseSetUserContext,
  firebaseTrackScreen,
} from "./firebase-analytics";
import type { AnalyticsEvents, TrackEventArgs } from "./events";

export type UserContext = {
  userId: string;
  app_env: string;
  network: string;
  auth_method: "google";
  has_backup: boolean;
};

let enabled = false;

function normalizeScreen(pathname: string): string {
  const normalized = pathname.replace(/^\//, "").replace(/\//g, "_");
  return normalized.length > 0 ? normalized : "home";
}

export async function setEnabled(value: boolean) {
  enabled = value;

  try {
    await firebaseSetEnabled(value);
  } catch (error) {
    console.warn("[analytics] setEnabled failed", error);
  }
}

export async function trackScreen(pathname: string) {
  if (!enabled) return;
  const screenName = normalizeScreen(pathname);

  try {
    await firebaseTrackScreen(screenName);
  } catch (error) {
    console.warn("[analytics] trackScreen failed", error);
  }
}

export async function trackEvent<K extends keyof AnalyticsEvents>(
  ...[name, params]: TrackEventArgs<K>
) {
  if (!enabled) return;

  try {
    await firebaseLogEvent(
      name,
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined,
    );
  } catch (error) {
    console.warn(`[analytics] trackEvent "${name}" failed`, error);
  }
}

export async function setUserContext(ctx: UserContext) {
  if (!enabled) return;
  const { userId, ...properties } = ctx;

  try {
    await firebaseSetUserContext(userId, {
      ...properties,
      has_backup: String(properties.has_backup),
    });
  } catch (error) {
    console.warn("[analytics] setUserContext failed", error);
  }
}

export async function clearUserContext() {
  try {
    await firebaseClearUserContext({
      app_env: null,
      network: null,
      auth_method: null,
      has_backup: null,
    });
  } catch (error) {
    console.warn("[analytics] clearUserContext failed", error);
  }
}
