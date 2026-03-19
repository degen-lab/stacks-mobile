import React from "react";

import { fireEvent, render, screen } from "@/lib/tests";
import { useModal } from "@/components/ui";

import { BreadcrumbBar } from "../BreadcrumbBar";

const mockUsePathname = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/ui", () => {
  const actual = jest.requireActual("@/components/ui");
  return {
    ...actual,
    useModal: jest.fn(),
  };
});

jest.mock(
  "@/features/dual-stacking/components/wallet/wallet-connected",
  () => ({
    __esModule: true,
    default: () => null,
  }),
);

jest.mock("@/features/stacking/components/stacking-guide-modal", () => ({
  StackingGuideModal: () => null,
}));

jest.mock(
  "@/features/dual-stacking/components/layout/modals/dual-stacking-help-modal",
  () => ({
    DualStackingHelpModal: () => null,
  }),
);

jest.mock("@/features/sbtc-bridge/components/bridge-help-modal", () => ({
  BridgeHelpModal: () => null,
}));

describe("BreadcrumbBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/Earn/bridge");
  });

  it("opens the bridge help sheet from the bridge home breadcrumb action", () => {
    const bridgeHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };
    const stackingHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };
    const dualStackingHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };

    jest
      .mocked(useModal)
      .mockReturnValueOnce(bridgeHelpModal as any)
      .mockReturnValueOnce(stackingHelpModal as any)
      .mockReturnValueOnce(dualStackingHelpModal as any);

    render(<BreadcrumbBar />);

    fireEvent.press(screen.getByLabelText("Help"));

    expect(bridgeHelpModal.present).toHaveBeenCalledTimes(1);
    expect(stackingHelpModal.present).not.toHaveBeenCalled();
    expect(dualStackingHelpModal.present).not.toHaveBeenCalled();
  });

  it("opens the dual stacking help sheet next to the connected wallet control", () => {
    mockUsePathname.mockReturnValue("/Earn/dual-stacking");

    const bridgeHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };
    const stackingHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };
    const dualStackingHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };

    jest
      .mocked(useModal)
      .mockReturnValueOnce(bridgeHelpModal as any)
      .mockReturnValueOnce(stackingHelpModal as any)
      .mockReturnValueOnce(dualStackingHelpModal as any);

    render(<BreadcrumbBar />);

    fireEvent.press(screen.getByLabelText("Help"));

    expect(dualStackingHelpModal.present).toHaveBeenCalledTimes(1);
    expect(bridgeHelpModal.present).not.toHaveBeenCalled();
    expect(stackingHelpModal.present).not.toHaveBeenCalled();
  });
});
