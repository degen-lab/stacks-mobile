const React = require("react");
const { View } = require("react-native");

const MockSvg = (props) => React.createElement(View, props);

module.exports = new Proxy(
  { __esModule: true, default: MockSvg },
  {
    get: (target, prop) => (prop in target ? target[prop] : MockSvg),
  },
);
