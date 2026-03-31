jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

global.setImmediate ??= (callback, ...args) => setTimeout(callback, 0, ...args);
global.clearImmediate ??= (handle) => clearTimeout(handle);

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


jest.mock("expo-tracking-transparency", () => ({
  getTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "undetermined" }),
  ),
  requestTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "denied" }),
  ),
}));
