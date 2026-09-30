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

  it("deletes the account before deleting the cloud backup", async () => {
    authState.hasBackup = true;
    const { result } = renderHook(() => useDeleteAccountFlow());

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(mockDeleteBackupWithoutPassword).toHaveBeenCalledTimes(1);
    expect(mockSetHasBackup).toHaveBeenCalledWith(false);
    expect(mockMutateAsync.mock.invocationCallOrder[0]).toBeLessThan(
      mockDeleteBackupWithoutPassword.mock.invocationCallOrder[0],
    );
    expect(mockClearLocalAccountData).toHaveBeenCalledTimes(1);
    expect(mockShowMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Account deleted",
        type: "success",
      }),
    );
    expect(__mockRouter.replace).toHaveBeenCalledWith("/login");
  });

  it("does not delete the cloud backup when account deletion fails", async () => {
    authState.hasBackup = true;
    mockMutateAsync.mockRejectedValue(new Error("missing user"));
    const { result } = renderHook(() => useDeleteAccountFlow());

    await act(async () => {
      await expect(result.current.deleteAccount()).rejects.toThrow(
        "missing user",
      );
    });

    expect(mockDeleteBackupWithoutPassword).not.toHaveBeenCalled();
    expect(mockClearLocalAccountData).not.toHaveBeenCalled();
  });

  it("clears local data after account deletion when cloud backup cleanup fails", async () => {
    authState.hasBackup = true;
    mockDeleteBackupWithoutPassword.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useDeleteAccountFlow());

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockDeleteBackupWithoutPassword).toHaveBeenCalledTimes(1);
    expect(mockClearLocalAccountData).toHaveBeenCalledTimes(1);
    expect(mockShowMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        description:
          "Your account was deleted, but the cloud backup could not be removed.",
        type: "warning",
      }),
    );
    expect(__mockRouter.replace).toHaveBeenCalledWith("/login");
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
