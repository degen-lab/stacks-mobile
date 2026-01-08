import { fireEvent, render } from "@/lib/tests";

import { GooglePasswordScreen } from "../google-password-screen";

const mockValidatePassword = jest.fn();

jest.mock("@/lib/password-strength", () => ({
  validatePassword: (password: string) => mockValidatePassword(password),
}));

const baseValidation = {
  score: 1,
  feedback: { warning: "" },
  meetsLengthRequirement: false,
  meetsScoreRequirement: false,
  meetsAllStrengthRequirements: false,
};

describe("GooglePasswordScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidatePassword.mockReturnValue(baseValidation);
  });

  it("prevents continue when password is weak in create mode", () => {
    const onContinue = jest.fn();

    const { getByTestId, getByText } = render(
      <GooglePasswordScreen
        mode="create"
        password="weak"
        onPasswordChange={jest.fn()}
        onContinue={onContinue}
      />,
    );

    fireEvent.press(getByTestId("google-password-continue"));

    expect(onContinue).not.toHaveBeenCalled();
    expect(getByText("At least 8 characters")).toBeTruthy();
    expect(
      getByText("Warning: This password cannot be reset. Keep it safe."),
    ).toBeTruthy();
  });

  it("allows continue when password meets strength requirements", () => {
    const onContinue = jest.fn();
    mockValidatePassword.mockReturnValue({
      ...baseValidation,
      score: 4,
      meetsLengthRequirement: true,
      meetsScoreRequirement: true,
      meetsAllStrengthRequirements: true,
    });

    const { getByTestId } = render(
      <GooglePasswordScreen
        mode="create"
        password="StrongPass123!"
        onPasswordChange={jest.fn()}
        onContinue={onContinue}
      />,
    );

    fireEvent.press(getByTestId("google-password-continue"));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("allows continue in recover mode with non-empty password", () => {
    const onContinue = jest.fn();

    const { getByTestId } = render(
      <GooglePasswordScreen
        mode="recover"
        password="any"
        onPasswordChange={jest.fn()}
        onContinue={onContinue}
      />,
    );

    fireEvent.press(getByTestId("google-password-continue"));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("shows forgot password action in recover mode", () => {
    const onForgotPassword = jest.fn();

    const { getByTestId, queryByText } = render(
      <GooglePasswordScreen
        mode="recover"
        password=""
        onPasswordChange={jest.fn()}
        onContinue={jest.fn()}
        onForgotPassword={onForgotPassword}
      />,
    );

    fireEvent.press(getByTestId("google-password-forgot"));

    expect(onForgotPassword).toHaveBeenCalledTimes(1);
    expect(queryByText("At least 8 characters")).toBeNull();
  });

  it("renders loading state with override text", () => {
    const { getByText } = render(
      <GooglePasswordScreen
        mode="create"
        password=""
        onPasswordChange={jest.fn()}
        onContinue={jest.fn()}
        isLoading
        loadingTitleOverride="Hang tight"
        loadingSubtitleOverride="Working on it"
      />,
    );

    expect(getByText("Hang tight")).toBeTruthy();
    expect(getByText("Working on it")).toBeTruthy();
  });
});
