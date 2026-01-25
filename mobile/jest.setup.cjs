/* eslint-env jest */
require("react-native-gesture-handler/jestSetup");
require("@shopify/flash-list/jestSetup");

jest.mock("expo-router");

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: { AUTOMATIC: "automatic" },
}));

jest.mock("axios", () => ({
  isAxiosError: (err) => Boolean(err?.isAxiosError),
  create: () => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaProvider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("moti");

jest.mock("@gorhom/bottom-sheet");
jest.mock("expo-image");
jest.mock("react-native-svg");
jest.mock("lucide-react-native");

jest.mock("@degenlab/stacks-wallet-kit-core", () => ({
  NetworkType: {
    Mainnet: "mainnet",
    Testnet: "testnet",
    Devnet: "devnet",
  },
  BaseClient: class BaseClient {
    constructor() {}
  },
}));

jest.mock("@degenlab/stacks-wallet-kit-mobile", () => ({
  MobileClient: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getAccounts: jest.fn(() => []),
    getCurrentAccount: jest.fn(() => null),
    switchAccount: jest.fn(),
    createAccount: jest.fn(),
    deleteAccount: jest.fn(),
    getNetwork: jest.fn(() => "testnet"),
    switchNetwork: jest.fn(),
  })),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ user: { id: "123", email: "test@example.com" } })),
    signOut: jest.fn(() => Promise.resolve()),
    revokeAccess: jest.fn(() => Promise.resolve()),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
}));
