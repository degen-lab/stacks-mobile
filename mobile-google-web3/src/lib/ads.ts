import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads";

/**
 * Get your device's test ID for adding to testDeviceIdentifiers
 *
 * To find your physical device ID:
 * 1. Run your app and make an ad request
 * 2. Check the logs/console for a message like:
 *    "Use RequestConfiguration.Builder.setTestDeviceIds(Arrays.asList("YOUR_DEVICE_ID"))"
 * 3. Copy the device ID and add it to the testDeviceIdentifiers array below
 *
 * Note: 'EMULATOR' automatically works for ALL Android emulators
 */
export function getTestDeviceIds(): string[] {
  const deviceIds: string[] = ["EMULATOR"]; // Works for all emulators

  // Add your physical device IDs here when you get them from the logs:
  // deviceIds.push('YOUR_PHYSICAL_DEVICE_ID_1');
  // deviceIds.push('YOUR_PHYSICAL_DEVICE_ID_2');

  return deviceIds;
}

/**
 * Initialize Google Mobile Ads SDK with request configuration
 * This must be called before loading any ads
 */
export async function initializeAds() {
  try {
    await mobileAds().setRequestConfiguration({
      // Update all future requests suitable for parental guidance
      // Options: MaxAdContentRating.G, MaxAdContentRating.PG, MaxAdContentRating.T, MaxAdContentRating.MA
      maxAdContentRating: MaxAdContentRating.PG,

      // Indicates that you want your content treated as child-directed for purposes of COPPA.
      // Set to true if your app targets children
      tagForChildDirectedTreatment: false,

      // Indicates that you want the ad request to be handled in a
      // manner suitable for users under the age of consent.
      // Set to true if your app targets users under age of consent
      tagForUnderAgeOfConsent: false,

      // An array of test device IDs to allow.
      // - 'EMULATOR' works for ALL Android emulators (no need to list individual AVDs)
      // - For physical devices: Run the app and check logs for "Use RequestConfiguration.Builder.setTestDeviceIds"
      //   The device ID will appear in the console/logcat when you make an ad request
      testDeviceIdentifiers: __DEV__ ? getTestDeviceIds() : [],
    });

    await mobileAds().initialize();

    console.log("[Ads] Google Mobile Ads SDK initialized successfully");
  } catch (error) {
    console.error("[Ads] Failed to initialize Google Mobile Ads SDK:", error);
    // Don't throw - allow app to continue even if ads fail to initialize
  }
}
