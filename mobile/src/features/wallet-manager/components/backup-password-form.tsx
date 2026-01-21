import { Button, Text, View } from "@/components/ui";
import { PasswordInput } from "@/features/login/components/password-input";
import { PasswordStrengthIndicator } from "@/features/login/components/password-strength-indicator";
import { validatePassword } from "@/lib/password-strength";
import { ReactNode } from "react";

export type BackupPasswordValidation = {
  isValid: boolean;
  passwordsMatch: boolean;
  meetsRequirements: boolean;
};

export const validateBackupPasswords = (
  password: string,
  confirmPassword: string,
): BackupPasswordValidation => {
  if (!password) {
    return { isValid: false, passwordsMatch: false, meetsRequirements: false };
  }

  const validation = validatePassword(password);
  const meetsRequirements = validation.meetsAllStrengthRequirements;
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  return {
    isValid: meetsRequirements && passwordsMatch,
    passwordsMatch,
    meetsRequirements,
  };
};

type BackupPasswordFormProps = {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
  validation: BackupPasswordValidation;
  loading?: boolean;
  submitLabel: string;
  busyLabel: string;
  onSubmit: () => void;
  footer?: ReactNode;
};

export const BackupPasswordForm = ({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  validation,
  loading,
  submitLabel,
  busyLabel,
  onSubmit,
  footer,
}: BackupPasswordFormProps) => {
  return (
    <View className="gap-4">
      <View>
        <Text className="mb-2 text-base font-instrument-sans-medium text-primary">
          Backup Password
        </Text>
        <PasswordInput
          password={password}
          showPassword={showPassword}
          onPasswordChange={onPasswordChange}
          onToggleShowPassword={onToggleShowPassword}
        />
        {password.length > 0 && (
          <PasswordStrengthIndicator password={password} />
        )}
      </View>

      <View>
        <Text className="mb-2 text-base font-instrument-sans-medium text-primary">
          Confirm Password
        </Text>
        <PasswordInput
          password={confirmPassword}
          showPassword={showConfirmPassword}
          onPasswordChange={onConfirmPasswordChange}
          onToggleShowPassword={onToggleShowConfirmPassword}
          error={
            confirmPassword.length > 0 && !validation.passwordsMatch
              ? "Passwords do not match"
              : undefined
          }
        />
      </View>

      <Button
        variant="default"
        size="lg"
        label={loading ? busyLabel : submitLabel}
        onPress={onSubmit}
        loading={loading}
        disabled={!validation.isValid || Boolean(loading)}
      />

      {footer}
    </View>
  );
};
