import React from "react";

import { fireEvent, render, screen } from "@/lib/tests";
import { useModal } from "@/components/ui";

import { BreadcrumbBar } from "../BreadcrumbBar";

const mockUsePathname = jest.fn();
const mockUseGlobalSearchParams = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  usePathname: () => mockUsePathname(),
  useGlobalSearchParams: () => mockUseGlobalSearchParams(),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/ui", () => {
  const actual = jest.requireActual("@/components/ui");
  return {
    ...actual,
    useModal: jest.fn(),
  };
});

jest.mock("@/features/header/components/connected-wallet", () => ({
  __esModule: true,
  default: () => null,
  ConnectedWallet: () => null,
}));

jest.mock("@/features/stacking/components/stacking-guide-modal", () => ({
  StackingGuideModal: () => null,
}));

jest.mock("@/features/earn/components/earn-help-modal", () => ({
  EarnHelpModal: () => null,
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
    mockUsePathname.mockReturnValue("/Earn/sbtc-bridge");
    mockUseGlobalSearchParams.mockReturnValue({});
  });

  it("opens the bridge help sheet from the bridge home breadcrumb action", () => {
    const earnHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };
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
      .mockReturnValueOnce(earnHelpModal as any)
      .mockReturnValueOnce(bridgeHelpModal as any)
      .mockReturnValueOnce(stackingHelpModal as any)
      .mockReturnValueOnce(dualStackingHelpModal as any);

    render(<BreadcrumbBar />);

    fireEvent.press(screen.getByLabelText("Help"));

    expect(earnHelpModal.present).not.toHaveBeenCalled();
    expect(bridgeHelpModal.present).toHaveBeenCalledTimes(1);
    expect(stackingHelpModal.present).not.toHaveBeenCalled();
    expect(dualStackingHelpModal.present).not.toHaveBeenCalled();
  });

  it("opens the dual stacking help sheet next to the connected wallet control", () => {
    mockUsePathname.mockReturnValue("/Earn/dual-stacking");

    const earnHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };
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
      .mockReturnValueOnce(earnHelpModal as any)
      .mockReturnValueOnce(bridgeHelpModal as any)
      .mockReturnValueOnce(stackingHelpModal as any)
      .mockReturnValueOnce(dualStackingHelpModal as any);

    render(<BreadcrumbBar />);

    fireEvent.press(screen.getByLabelText("Help"));

    expect(earnHelpModal.present).not.toHaveBeenCalled();
    expect(dualStackingHelpModal.present).toHaveBeenCalledTimes(1);
    expect(bridgeHelpModal.present).not.toHaveBeenCalled();
    expect(stackingHelpModal.present).not.toHaveBeenCalled();
  });

  it("opens the earn help sheet on the earn landing page", () => {
    mockUsePathname.mockReturnValue("/Earn");

    const earnHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };
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
      .mockReturnValueOnce(earnHelpModal as any)
      .mockReturnValueOnce(bridgeHelpModal as any)
      .mockReturnValueOnce(stackingHelpModal as any)
      .mockReturnValueOnce(dualStackingHelpModal as any);

    render(<BreadcrumbBar />);

    expect(screen.getByText("Earn")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Help"));

    expect(earnHelpModal.present).toHaveBeenCalledTimes(1);
    expect(bridgeHelpModal.present).not.toHaveBeenCalled();
    expect(stackingHelpModal.present).not.toHaveBeenCalled();
    expect(dualStackingHelpModal.present).not.toHaveBeenCalled();
  });

  it("renders the selected asset label on asset detail routes", () => {
    mockUsePathname.mockReturnValue("/Earn/assets/stx");
    mockUseGlobalSearchParams.mockReturnValue({ assetLabel: "Stacks" });

    const earnHelpModal = {
      ref: { current: null },
      present: jest.fn(),
      dismiss: jest.fn(),
    };
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
      .mockReturnValueOnce(earnHelpModal as any)
      .mockReturnValueOnce(bridgeHelpModal as any)
      .mockReturnValueOnce(stackingHelpModal as any)
      .mockReturnValueOnce(dualStackingHelpModal as any);

    render(<BreadcrumbBar />);

    expect(screen.getByText("Earn")).toBeTruthy();
    expect(screen.getByText("Stacks")).toBeTruthy();
    expect(screen.queryByLabelText("Help")).toBeNull();
  });
});
