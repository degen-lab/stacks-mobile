require("react-native-gesture-handler/jestSetup");
require("@shopify/flash-list/jestSetup");

jest.mock("expo-router", () => {
  const React = require("react");
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  };

  return {
    useRouter: () => mockRouter,
    useSearchParams: () => ({}),
    Link: ({ children }) => React.createElement(React.Fragment, null, children),
    __mockRouter: mockRouter,
  };
});

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

jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  return {
    BottomSheetModalProvider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("expo-image", () => {
  const React = require("react");
  const { Image } = require("react-native");
  const MockImage = (props) => React.createElement(Image, props);

  return {
    Image: MockImage,
    ImageBackground: MockImage,
    default: MockImage,
    prefetch: jest.fn(),
  };
});

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockSvg = (props) => React.createElement(View, props);

  return new Proxy(
    { __esModule: true, default: MockSvg },
    {
      get: (target, prop) => (prop in target ? target[prop] : MockSvg),
    },
  );
});
