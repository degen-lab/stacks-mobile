const React = require("react");
const { Image, ScrollView, Text, View } = require("react-native");

const passthrough = (Component) => (props) =>
  React.createElement(Component, props, props.children);

module.exports = {
  MotiView: passthrough(View),
  MotiText: passthrough(Text),
  MotiImage: passthrough(Image),
  MotiScrollView: passthrough(ScrollView),
};
