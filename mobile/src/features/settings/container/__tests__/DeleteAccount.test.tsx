import { fireEvent, render } from "@/lib/tests";

import DeleteAccountScreen from "../DeleteAccount";

const mockDeleteAccount = jest.fn();
const mockRecoveryModalPresent = jest.fn();
const mockConfirmModalPresent = jest.fn();
const mockDismiss = jest.fn();

let mockModalCallCount = 0;

jest.mock("@/components/ui", () => {
  const actual = jest.requireActual("@/components/ui");

  return {
    ...actual,
    useModal: () => {
      mockModalCallCount += 1;

      return mockModalCallCount % 2 === 1
        ? {
            ref: { current: null },
            present: mockRecoveryModalPresent,
            dismiss: mockDismiss,
          }
        : {
            ref: { current: null },
            present: mockConfirmModalPresent,
            dismiss: mockDismiss,
          };
    },
  };
});

jest.mock("@/components/warning-sheet", () => ({
  WarningSheet: () => null,
}));

jest.mock("@/features/wallet-manager/components/view-mnemonic-modal", () => ({
  ViewMnemonicModal: () => null,
}));

jest.mock("../../hooks/use-delete-account-flow", () => ({
  useDeleteAccountFlow: () => ({
    deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
    isDeleting: false,
  }),
}));

describe("DeleteAccountScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModalCallCount = 0;
  });

  it("keeps deletion disabled until both acknowledgements are checked", () => {
    const { getByTestId } = render(<DeleteAccountScreen />);

    fireEvent.press(getByTestId("delete-account-submit"));
    expect(mockConfirmModalPresent).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("delete-account-recovery-checkbox"));
    fireEvent.press(getByTestId("delete-account-submit"));
    expect(mockConfirmModalPresent).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("delete-account-confirm-checkbox"));
    fireEvent.press(getByTestId("delete-account-submit"));
    expect(mockConfirmModalPresent).toHaveBeenCalledTimes(1);
  });

  it("opens the recovery phrase modal from the CTA", () => {
    const { getByTestId } = render(<DeleteAccountScreen />);

    fireEvent.press(getByTestId("view-recovery-phrase-button"));

    expect(mockRecoveryModalPresent).toHaveBeenCalledTimes(1);
  });
});
