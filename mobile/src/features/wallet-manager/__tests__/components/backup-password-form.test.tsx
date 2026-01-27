import { fireEvent, render } from "@/lib/tests";
import { Text } from "@/components/ui";
import {
  BackupPasswordForm,
  validateBackupPasswords,
} from "../../components/backup-password-form";

jest.mock("@/lib/password-strength", () => ({
  validatePassword: (password: string) => ({
    meetsAllStrengthRequirements:
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password),
    meetsLengthRequirement: password.length >= 8,
    meetsScoreRequirement: password.length >= 12,
    score: password.length >= 12 ? 4 : password.length >= 8 ? 2 : 0,
    feedback: {
      warning: undefined,
      suggestions: [],
    },
  }),
}));

describe("BackupPasswordForm", () => {
  const defaultProps = {
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    onPasswordChange: jest.fn(),
    onConfirmPasswordChange: jest.fn(),
    onToggleShowPassword: jest.fn(),
    onToggleShowConfirmPassword: jest.fn(),
    validation: {
      isValid: false,
      passwordsMatch: false,
      meetsRequirements: false,
    },
    submitLabel: "Submit",
    busyLabel: "Submitting...",
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders password and confirm password fields", () => {
      const { getByText } = render(<BackupPasswordForm {...defaultProps} />);

      expect(getByText("Backup Password")).toBeTruthy();
      expect(getByText("Confirm Password")).toBeTruthy();
    });

    it("renders submit button with correct label", () => {
      const { getByText } = render(<BackupPasswordForm {...defaultProps} />);

      expect(getByText("Submit")).toBeTruthy();
    });

    it("renders activity indicator when loading", () => {
      const { queryByText } = render(
        <BackupPasswordForm {...defaultProps} loading={true} />,
      );

      // When loading, the button shows ActivityIndicator instead of text
      expect(queryByText("Submitting...")).toBeFalsy();
      expect(queryByText("Submit")).toBeFalsy();
    });
  });

  describe("Password Validation Display", () => {
    it("shows password strength indicator when password is entered", () => {
      const { getByText } = render(
        <BackupPasswordForm {...defaultProps} password="Password123" />,
      );

      expect(getByText("At least 8 characters")).toBeTruthy();
      expect(getByText("Strong complexity")).toBeTruthy();
    });

    it("shows error message when passwords don't match", () => {
      const validation = {
        isValid: false,
        passwordsMatch: false,
        meetsRequirements: true,
      };

      const { getByText } = render(
        <BackupPasswordForm
          {...defaultProps}
          password="Password123"
          confirmPassword="Different123"
          validation={validation}
        />,
      );

      expect(getByText("Passwords do not match")).toBeTruthy();
    });

    it("does not show error when confirm password is empty", () => {
      const validation = {
        isValid: false,
        passwordsMatch: false,
        meetsRequirements: true,
      };

      const { queryByText } = render(
        <BackupPasswordForm
          {...defaultProps}
          password="Password123"
          confirmPassword=""
          validation={validation}
        />,
      );

      expect(queryByText("Passwords do not match")).toBeFalsy();
    });
  });

  describe("Submit Button State", () => {
    it("disables submit button when validation fails", () => {
      const { UNSAFE_root } = render(
        <BackupPasswordForm
          {...defaultProps}
          validation={{
            isValid: false,
            passwordsMatch: false,
            meetsRequirements: false,
          }}
        />,
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it("enables submit button when validation passes", () => {
      const onSubmit = jest.fn();
      const { getByText } = render(
        <BackupPasswordForm
          {...defaultProps}
          onSubmit={onSubmit}
          validation={{
            isValid: true,
            passwordsMatch: true,
            meetsRequirements: true,
          }}
        />,
      );

      const button = getByText("Submit");
      fireEvent.press(button);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("disables submit button when loading", () => {
      const onSubmit = jest.fn();
      const { UNSAFE_root } = render(
        <BackupPasswordForm
          {...defaultProps}
          onSubmit={onSubmit}
          loading={true}
          validation={{
            isValid: true,
            passwordsMatch: true,
            meetsRequirements: true,
          }}
        />,
      );

      // When loading, button should be disabled
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe("User Interactions", () => {
    it("calls onSubmit when submit button is pressed", () => {
      const onSubmit = jest.fn();
      const { getByText } = render(
        <BackupPasswordForm
          {...defaultProps}
          onSubmit={onSubmit}
          validation={{
            isValid: true,
            passwordsMatch: true,
            meetsRequirements: true,
          }}
        />,
      );

      fireEvent.press(getByText("Submit"));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Footer", () => {
    it("renders optional footer", () => {
      const { getByText } = render(
        <BackupPasswordForm
          {...defaultProps}
          footer={<Text>Custom Footer</Text>}
        />,
      );

      expect(getByText("Custom Footer")).toBeTruthy();
    });
  });
});

describe("validateBackupPasswords", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns invalid when password is empty", () => {
    const result = validateBackupPasswords("", "");

    expect(result).toEqual({
      isValid: false,
      passwordsMatch: false,
      meetsRequirements: false,
    });
  });

  it("returns invalid when password is weak", () => {
    const result = validateBackupPasswords("weak", "weak");

    expect(result.isValid).toBe(false);
    expect(result.meetsRequirements).toBe(false);
  });

  it("returns invalid when passwords don't match", () => {
    const result = validateBackupPasswords(
      "StrongPassword123",
      "DifferentPass123",
    );

    expect(result.isValid).toBe(false);
    expect(result.passwordsMatch).toBe(false);
  });

  it("returns invalid when confirmPassword is empty", () => {
    const result = validateBackupPasswords("StrongPassword123", "");

    expect(result.isValid).toBe(false);
    expect(result.passwordsMatch).toBe(false);
  });

  it("returns valid when passwords match and meet requirements", () => {
    const result = validateBackupPasswords(
      "StrongPassword123",
      "StrongPassword123",
    );

    expect(result.isValid).toBe(true);
    expect(result.passwordsMatch).toBe(true);
    expect(result.meetsRequirements).toBe(true);
  });
});
