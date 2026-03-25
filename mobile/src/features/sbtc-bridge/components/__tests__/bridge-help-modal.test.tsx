import type { ReactNode } from "react";
import React from "react";

import { fireEvent, render, screen } from "@/lib/tests";

import { BridgeHelpModal } from "../bridge-help-modal";

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

describe("BridgeHelpModal", () => {
  it("renders the bridge FAQ and keeps a single answer open", () => {
    const ref = React.createRef<any>();

    render(<BridgeHelpModal modalRef={ref} />);

    expect(screen.getByText("sBTC Bridge help")).toBeTruthy();
    expect(screen.getByText("What is sBTC?")).toBeTruthy();
    expect(screen.getByText("How does the bridge work?")).toBeTruthy();
    expect(screen.getByText("How long do deposits take?")).toBeTruthy();
    expect(screen.getByText("How long do withdrawals take?")).toBeTruthy();

    expect(
      screen.getByText(
        "sBTC is Bitcoin you can use on Stacks. It is designed to track BTC 1:1, so you can use Bitcoin in Stacks apps without leaving the Stacks ecosystem.",
      ),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("how-bridge-works-trigger"));

    expect(
      screen.queryByText(
        "sBTC is Bitcoin you can use on Stacks. It is designed to track BTC 1:1, so you can use Bitcoin in Stacks apps without leaving the Stacks ecosystem.",
      ),
    ).toBeNull();
    expect(
      screen.getByText(
        "For deposits, you send BTC to the bridge address and wait for Bitcoin confirmations. Once confirmed, sBTC is minted to your selected Stacks address. For withdrawals, you burn sBTC on Stacks and BTC is released to your selected Bitcoin address.",
      ),
    ).toBeTruthy();
  });
});
