import { act, fireEvent, render, waitFor } from "@/lib/tests";
import { __mockRouter } from "expo-router";
import { InteractionManager } from "react-native";

import RestoreWallet from "@/app/wallet-restore";

const mockRestoreWallet = jest.fn();
const mockDeleteBackupWithoutPassword = jest.fn();
const mockSignOut = jest.fn();

const mockWarningSheetState: {
  present: jest.Mock;
  dismiss: jest.Mock;
  props: Record<string, any> | null;
} = {
  present: jest.fn(),
  dismiss: jest.fn(),
  props: null,
};

jest.mock("@/hooks/use-create-wallet", () => ({
  useRestoreWallet: () => ({
    restoreWallet: (...args: unknown[]) => mockRestoreWallet(...args),
  }),
  useDeleteGoogleBackup: () => ({
    deleteBackupWithoutPassword: (...args: unknown[]) =>
      mockDeleteBackupWithoutPassword(...args),
  }),
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => ({
    signOut: (...args: unknown[]) => mockSignOut(...args),
  }),
}));


jest.mock("@/components/warning-sheet", () => {
  const React = jest.requireActual("react");

  const WarningSheet = React.forwardRef(
    (props: Record<string, any> | null, ref: any) => {
      mockWarningSheetState.props = props;

      React.useImperativeHandle(ref, () => ({
        present: mockWarningSheetState.present,
        dismiss: mockWarningSheetState.dismiss,
      }));

      return null;
    },
  );

  WarningSheet.displayName = "WarningSheet";

  return {
    WarningSheet,
  };
});

jest.mock("@/lib/password-strength", () => ({
  validatePassword: (password: string) => mockValidatePassword(password),
}));

const baseValidation = {
  score: 4,
  feedback: { warning: "" },
  meetsLengthRequirement: true,
  meetsScoreRequirement: true,
  meetsAllStrengthRequirements: true,
};

describe("RestoreWallet screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidatePassword.mockReturnValue(baseValidation);
    mockSignOut.mockResolvedValue(undefined);
    mockWarningSheetState.props = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("restores wallet and routes home", async () => {
    mockRestoreWallet.mockResolvedValue(undefined);

    const { getByTestId } = render(<RestoreWallet />);

    fireEvent.changeText(
      getByTestId("google-password-input"),
      "StrongPass123!",
    );
    fireEvent.press(getByTestId("google-password-continue"));

    await waitFor(() => {
      expect(mockRestoreWallet).toHaveBeenCalledWith({
        password: "StrongPass123!",
      });
      expect(__mockRouter.replace).toHaveBeenCalledWith("/");
    });
  });

  it("shows error when wallet restore fails", async () => {
    mockRestoreWallet.mockRejectedValue(new Error("nope"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { getByTestId, getByText } = render(<RestoreWallet />);

    fireEvent.changeText(getByTestId("google-password-input"), "Pass123!");
    fireEvent.press(getByTestId("google-password-continue"));

    await waitFor(() => {
      expect(getByText("Restore failed. Please try again.")).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it("signs out and returns to login on back", async () => {
    const { getByTestId } = render(<RestoreWallet />);

    fireEvent.press(getByTestId("google-password-back"));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(__mockRouter.replace).toHaveBeenCalledWith("/login");
    });
  });

  it("shows loading state while restoring wallet", async () => {
    mockRestoreWallet.mockImplementation(() => new Promise(() => {}));

    const { getByTestId, getByText } = render(<RestoreWallet />);

    fireEvent.changeText(getByTestId("google-password-input"), "Pass123!");
    fireEvent.press(getByTestId("google-password-continue"));

    await waitFor(() => {
      expect(getByText("Restoring your wallet...")).toBeTruthy();
    });
  });

  it("deletes backup and routes to wallet creation after dismissal", async () => {
    mockDeleteBackupWithoutPassword.mockResolvedValue(undefined);
    jest
      .spyOn(InteractionManager, "runAfterInteractions")
      .mockImplementation(
        (
          task?: Parameters<typeof InteractionManager.runAfterInteractions>[0],
        ) => {
          if (typeof task === "function") {
            task();
          }
          return {
            cancel: jest.fn(),
            done: jest.fn(),
            then: jest.fn().mockResolvedValue(undefined),
          };
        },
      );
    const { getByTestId } = render(<RestoreWallet />);

    fireEvent.press(getByTestId("google-password-forgot"));

    expect(mockWarningSheetState.present).toHaveBeenCalledTimes(1);

    await act(async () => {
      await mockWarningSheetState.props?.onConfirm();
    });

    expect(mockDeleteBackupWithoutPassword).toHaveBeenCalledTimes(1);
    expect(mockWarningSheetState.dismiss).toHaveBeenCalledTimes(1);

    act(() => {
      mockWarningSheetState.props?.onDismiss();
    });

    await waitFor(() => {
      expect(__mockRouter.replace).toHaveBeenCalledWith("/wallet-new");
    });
  });

  it("shows error when backup deletion fails", async () => {
    mockDeleteBackupWithoutPassword.mockRejectedValue(new Error("nope"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { getByTestId } = render(<RestoreWallet />);

    fireEvent.press(getByTestId("google-password-forgot"));

    await act(async () => {
      await mockWarningSheetState.props?.onConfirm();
    });

    await waitFor(() => {
      expect(mockDeleteBackupWithoutPassword).toHaveBeenCalledTimes(1);
      expect(mockWarningSheetState.props?.error).toBe(
        "Failed to delete backup. Please try again.",
      );
    });

    expect(mockWarningSheetState.dismiss).not.toHaveBeenCalled();
    expect(__mockRouter.replace).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
const mockValidatePassword = jest.fn();
