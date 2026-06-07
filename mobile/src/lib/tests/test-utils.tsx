import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions } from "@testing-library/react-native";
import { render, userEvent } from "@testing-library/react-native";
import type { ReactElement } from "react";
import React from "react";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createAppWrapper = () => {
  const queryClient = createTestQueryClient();

  const AppWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BottomSheetModalProvider>
        <NavigationContainer>{children}</NavigationContainer>
      </BottomSheetModalProvider>
    </QueryClientProvider>
  );
  AppWrapper.displayName = "AppWrapper";
  return AppWrapper;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => {
  const Wrapper = createAppWrapper();
  return render(ui, { wrapper: Wrapper, ...options });
};

export const setup = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => {
  const Wrapper = createAppWrapper();
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
};

export {
  act,
  cleanup,
  fireEvent,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";

export { customRender as render };
