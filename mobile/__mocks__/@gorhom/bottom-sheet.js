const React = require("react");

module.exports = {
  BottomSheetModal: React.forwardRef(({ children }, _ref) =>
    React.createElement(React.Fragment, null, children),
  ),
  BottomSheetModalProvider: ({ children }) =>
    React.createElement(React.Fragment, null, children),
  useBottomSheet: () => ({ close: jest.fn() }),
};
