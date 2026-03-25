import type { ReactNode } from "react";
import React from "react";

import { render, screen } from "@/lib/tests";

import { Modal } from "../modal";
import { Text } from "../text";

jest.mock("@gorhom/bottom-sheet", () => {
  const ReactActual = jest.requireActual("react") as typeof import("react");
  const ReactNative = jest.requireActual(
    "react-native",
  ) as typeof import("react-native");

  const BottomSheetModal = ReactActual.forwardRef(
    (
      {
        children,
        handleComponent,
      }: {
        children: ReactNode;
        handleComponent?: () => ReactNode;
      },
      ref: React.Ref<{ present: jest.Mock; dismiss: jest.Mock }>,
    ) => {
      ReactActual.useImperativeHandle(ref, () => ({
        present: jest.fn(),
        dismiss: jest.fn(),
      }));

      return ReactActual.createElement(
        ReactNative.View,
        null,
        handleComponent ? handleComponent() : null,
        children,
      );
    },
  );

  BottomSheetModal.displayName = "BottomSheetModal";

  return {
    BottomSheetModal,
    BottomSheetModalProvider: ({ children }: { children: ReactNode }) =>
      ReactActual.createElement(ReactNative.View, null, children),
    BottomSheetScrollView: ({ children, ...props }: any) =>
      ReactActual.createElement(ReactNative.ScrollView, props, children),
    useBottomSheet: () => ({ close: jest.fn() }),
  };
});

describe("Modal", () => {
  it("renders headerTitle instead of the plain title", () => {
    const ref = React.createRef<any>();

    render(
      <Modal
        ref={ref}
        title="Plain title"
        headerTitle={<Text>Custom header title</Text>}
      >
        <Text>Body</Text>
      </Modal>,
    );

    expect(screen.getByText("Custom header title")).toBeTruthy();
    expect(screen.queryByText("Plain title")).toBeNull();
    expect(screen.getByText("Body")).toBeTruthy();
  });
});
