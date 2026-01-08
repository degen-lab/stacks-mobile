import { render } from "@/lib/tests";

import {
  PasswordStrengthIndicator,
  calculatePasswordStrength,
} from "../password-strength-indicator";

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

describe("calculatePasswordStrength", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty strength for blank password", () => {
    const result = calculatePasswordStrength("");
    expect(result).toEqual({ level: 0, label: "", colorClass: "bg-sand-200" });
    expect(mockValidatePassword).not.toHaveBeenCalled();
  });

  it("maps max score without length to Good", () => {
    mockValidatePassword.mockReturnValue({
      ...baseValidation,
      score: 4,
      meetsAllStrengthRequirements: false,
    });

    const result = calculatePasswordStrength("password");

    expect(result).toEqual({
      level: 3,
      label: "Good",
      colorClass: "bg-yellow-500",
    });
  });

  it("maps max score with requirements to Strong", () => {
    mockValidatePassword.mockReturnValue({
      ...baseValidation,
      score: 4,
      meetsAllStrengthRequirements: true,
    });

    const result = calculatePasswordStrength("strong-password");

    expect(result).toEqual({
      level: 4,
      label: "Strong",
      colorClass: "bg-green-600",
    });
  });
});

describe("PasswordStrengthIndicator", () => {
  beforeEach(() => {
    mockValidatePassword.mockReturnValue({
      ...baseValidation,
      feedback: { warning: "Try a longer password." },
    });
  });

  it("renders requirements and warning text", () => {
    const { getByText } = render(
      <PasswordStrengthIndicator password="short" />,
    );

    expect(getByText("At least 8 characters")).toBeTruthy();
    expect(getByText("Strong complexity")).toBeTruthy();
    expect(getByText("Try a longer password.")).toBeTruthy();
  });
});
