const React = require("react");
const { Image } = require("react-native");

const MockImage = (props) => React.createElement(Image, props);

module.exports = {
  Image: MockImage,
  ImageBackground: MockImage,
  default: MockImage,
  prefetch: jest.fn(),
};
