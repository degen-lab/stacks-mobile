import "expo-router";

declare module "expo-router" {
  export const __mockRouter: {
    replace: (...args: unknown[]) => unknown;
    push: (...args: unknown[]) => unknown;
    back: (...args: unknown[]) => unknown;
  };
}
