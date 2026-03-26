import analytics from "@react-native-firebase/analytics";

let analyticsCollectionEnabled = false;

export async function setAnalyticsEnabled(enabled: boolean) {
  analyticsCollectionEnabled = enabled;

  try {
    await analytics().setAnalyticsCollectionEnabled(enabled);
  } catch (error) {
    console.warn("Failed to update analytics collection state:", error);
  }
}

export async function trackScreenView(pathname: string) {
  if (!analyticsCollectionEnabled) return;

  const normalizedPath = pathname.replace(/^\//, "").replace(/\//g, "_");
  const screenName = normalizedPath.length > 0 ? normalizedPath : "home";

  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.warn("Failed to track screen view:", error);
  }
}

export async function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  if (!analyticsCollectionEnabled) return;

  try {
    await analytics().logEvent(name, params);
  } catch (error) {
    console.warn(`Failed to log analytics event "${name}":`, error);
  }
}
