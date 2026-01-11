const React = require("react");

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
};

const useRouter = () => mockRouter;
const useSearchParams = () => ({});
const Link = ({ children }) =>
  React.createElement(React.Fragment, null, children);

module.exports = {
  useRouter,
  useSearchParams,
  Link,
  __mockRouter: mockRouter,
};
