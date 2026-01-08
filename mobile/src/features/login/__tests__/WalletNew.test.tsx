import { fireEvent, render, waitFor } from "@/lib/tests";
import { __mockRouter } from "expo-router";

import CreateWallet from "@/app/wallet-new";

const mockCreateWallet = jest.fn();
const mockSignOut = jest.fn();

jest.mock("@/hooks/use-create-wallet", () => ({
  useCreateWallet: () => ({
    createWallet: (...args: unknown[]) => mockCreateWallet(...args),
  }),
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => ({
    signOut: (...args: unknown[]) => mockSignOut(...args),
  }),
}));

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

describe("CreateWallet screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidatePassword.mockReturnValue(baseValidation);
    mockSignOut.mockResolvedValue(undefined);
  });

  it("creates wallet and routes home", async () => {
    mockCreateWallet.mockResolvedValue(undefined);

    const { getByTestId } = render(<CreateWallet />);

    fireEvent.changeText(
      getByTestId("google-password-input"),
      "StrongPass123!",
    );
    fireEvent.press(getByTestId("google-password-continue"));

    await waitFor(() => {
      expect(mockCreateWallet).toHaveBeenCalledWith({
        password: "StrongPass123!",
      });
      expect(__mockRouter.replace).toHaveBeenCalledWith("/");
    });
  });

  it("shows error when wallet creation fails", async () => {
    mockCreateWallet.mockRejectedValue(new Error("nope"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { getByTestId, getByText } = render(<CreateWallet />);

    fireEvent.changeText(getByTestId("google-password-input"), "Pass123!");
    fireEvent.press(getByTestId("google-password-continue"));

    await waitFor(() => {
      expect(
        getByText("Wallet creation failed. Please try again."),
      ).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it("signs out and returns to login on back", async () => {
    const { getByTestId } = render(<CreateWallet />);

    fireEvent.press(getByTestId("google-password-back"));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(__mockRouter.replace).toHaveBeenCalledWith("/login");
    });
  });

  it("shows loading state while creating wallet", async () => {
    mockCreateWallet.mockImplementation(() => new Promise(() => {}));

    const { getByTestId, getByText } = render(<CreateWallet />);

    fireEvent.changeText(
      getByTestId("google-password-input"),
      "StrongPass123!",
    );
    fireEvent.press(getByTestId("google-password-continue"));

    await waitFor(() => {
      expect(getByText("Creating your wallet...")).toBeTruthy();
    });
  });
});
const mockValidatePassword = jest.fn();
