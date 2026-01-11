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
