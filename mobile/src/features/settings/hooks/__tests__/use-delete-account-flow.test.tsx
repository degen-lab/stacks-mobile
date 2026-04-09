import { act, renderHook } from "@testing-library/react-native";
import { __mockRouter } from "expo-router";

import { useDeleteAccountFlow } from "../use-delete-account-flow";

const mockDeleteBackupWithoutPassword = jest.fn();
const mockMutateAsync = jest.fn();
const mockSetHasBackup = jest.fn();
const mockClearLocalAccountData = jest.fn();
const mockShowMessage = jest.fn();

const authState = {
  hasBackup: false,
};

jest.mock("@/api/user", () => ({
  useDeleteAccount: () => ({
    mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-create-wallet", () => ({
  useDeleteGoogleBackup: () => ({
    deleteBackupWithoutPassword: (...args: unknown[]) =>
      mockDeleteBackupWithoutPassword(...args),
  }),
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => ({
    hasBackup: authState.hasBackup,
    setHasBackup: (...args: unknown[]) => mockSetHasBackup(...args),
  }),
  clearLocalAccountData: (...args: unknown[]) =>
    mockClearLocalAccountData(...args),
}));

jest.mock("react-native-flash-message", () => ({
  showMessage: (...args: unknown[]) => mockShowMessage(...args),
}));

describe("useDeleteAccountFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authState.hasBackup = false;
    mockMutateAsync.mockResolvedValue({
      success: true,
      message: "Account deleted successfully",
    });
    mockDeleteBackupWithoutPassword.mockResolvedValue(undefined);
    mockClearLocalAccountData.mockResolvedValue(undefined);
  });

  it("deletes the cloud backup before deleting the account", async () => {
    authState.hasBackup = true;
    const { result } = renderHook(() => useDeleteAccountFlow());

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(mockDeleteBackupWithoutPassword).toHaveBeenCalledTimes(1);
    expect(mockSetHasBackup).toHaveBeenCalledWith(false);
    expect(
      mockDeleteBackupWithoutPassword.mock.invocationCallOrder[0],
    ).toBeLessThan(mockMutateAsync.mock.invocationCallOrder[0]);
    expect(mockClearLocalAccountData).toHaveBeenCalledTimes(1);
    expect(mockShowMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Account deleted",
        type: "success",
      }),
    );
    expect(__mockRouter.replace).toHaveBeenCalledWith("/login");
  });

  it("blocks account deletion when the cloud backup cannot be removed", async () => {
    authState.hasBackup = true;
    mockDeleteBackupWithoutPassword.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useDeleteAccountFlow());

    await act(async () => {
      await expect(result.current.deleteAccount()).rejects.toThrow(
        "Failed to delete cloud backup. Your account was not deleted.",
      );
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockClearLocalAccountData).not.toHaveBeenCalled();
  });

  it("surfaces local cleanup failures after the account is deleted", async () => {
    mockClearLocalAccountData.mockRejectedValue(
      new Error("Failed to clear local account data."),
    );
    const { result } = renderHook(() => useDeleteAccountFlow());

    await act(async () => {
      await expect(result.current.deleteAccount()).rejects.toThrow(
        "Your account was deleted, but local cleanup did not finish. Please restart the app.",
      );
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockShowMessage).not.toHaveBeenCalled();
    expect(__mockRouter.replace).not.toHaveBeenCalled();
  });
});
