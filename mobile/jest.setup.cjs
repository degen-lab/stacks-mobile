jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        APP_ENV: "development",
        NETWORK: "testnet",
        API_URL: "http://localhost:3000",
      },
    },
  },
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({})),
    signOut: jest.fn(() => Promise.resolve()),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
    getTokens: jest.fn(() => Promise.resolve({})),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
}));

jest.mock("@react-native-firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({})),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  logEvent: jest.fn(() => Promise.resolve()),
  setUserId: jest.fn(() => Promise.resolve()),
  setUserProperties: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-google-mobile-ads", () => {
  const createRewardedAd = () => ({
    load: jest.fn(),
    show: jest.fn(),
    addAdEventListener: jest.fn(() => jest.fn()),
  });

  const mobileAds = jest.fn(() => ({
    setRequestConfiguration: jest.fn(() => Promise.resolve()),
    initialize: jest.fn(() => Promise.resolve()),
  }));

  return {
    __esModule: true,
    default: mobileAds,
    AdsConsent: {
      reset: jest.fn(() => Promise.resolve()),
      requestInfoUpdate: jest.fn(() =>
        Promise.resolve({
          status: "NOT_REQUIRED",
          canRequestAds: true,
          privacyOptionsRequirementStatus: "NOT_REQUIRED",
          isConsentFormAvailable: false,
        }),
      ),
      loadAndShowConsentFormIfRequired: jest.fn(() =>
        Promise.resolve({
          status: "OBTAINED",
          canRequestAds: true,
          privacyOptionsRequirementStatus: "REQUIRED",
          isConsentFormAvailable: true,
        }),
      ),
      showPrivacyOptionsForm: jest.fn(() =>
        Promise.resolve({
          status: "OBTAINED",
          canRequestAds: true,
          privacyOptionsRequirementStatus: "REQUIRED",
          isConsentFormAvailable: true,
        }),
      ),
      getConsentInfo: jest.fn(() =>
        Promise.resolve({
          status: "NOT_REQUIRED",
          canRequestAds: true,
          privacyOptionsRequirementStatus: "NOT_REQUIRED",
          isConsentFormAvailable: false,
        }),
      ),
      getUserChoices: jest.fn(() =>
        Promise.resolve({
          selectPersonalisedAds: true,
        }),
      ),
    },
    AdsConsentStatus: {
      UNKNOWN: "UNKNOWN",
      REQUIRED: "REQUIRED",
      NOT_REQUIRED: "NOT_REQUIRED",
      OBTAINED: "OBTAINED",
    },
    AdsConsentDebugGeography: {
      DISABLED: 0,
      EEA: 1,
    },
    AdsConsentPrivacyOptionsRequirementStatus: {
      UNKNOWN: "UNKNOWN",
      NOT_REQUIRED: "NOT_REQUIRED",
      REQUIRED: "REQUIRED",
    },
    MaxAdContentRating: {
      G: "G",
      PG: "PG",
    },
    RewardedAd: {
      createForAdRequest: jest.fn(() => createRewardedAd()),
    },
    AdEventType: {
      OPENED: "opened",
      CLOSED: "closed",
      ERROR: "error",
    },
    RewardedAdEventType: {
      LOADED: "loaded",
      EARNED_REWARD: "earned_reward",
    },
  };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const ReactNative = require("react-native");

  const BottomSheetModal = React.forwardRef(
    ({ children, handleComponent }, ref) => {
      React.useImperativeHandle(ref, () => ({
        present: jest.fn(),
        dismiss: jest.fn(),
      }));

      return React.createElement(
        ReactNative.View,
        null,
        handleComponent ? handleComponent() : null,
        children,
      );
    },
  );

  BottomSheetModal.displayName = "BottomSheetModal";

  return {
    BottomSheetModal,
    BottomSheetModalProvider: ({ children }) =>
      React.createElement(ReactNative.View, null, children),
    BottomSheetScrollView: ({ children, ...props }) =>
      React.createElement(ReactNative.ScrollView, props, children),
    useBottomSheet: () => ({ close: jest.fn() }),
  };
});

global.setImmediate ??= (callback, ...args) => setTimeout(callback, 0, ...args);
global.clearImmediate ??= (handle) => clearTimeout(handle);
