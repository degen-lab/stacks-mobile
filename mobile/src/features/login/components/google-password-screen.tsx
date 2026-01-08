import { ChevronLeft } from "lucide-react-native";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

import { Button, LoadingView, Text, View } from "@/components/ui";
import { validatePassword } from "@/lib/password-strength";

import { WarningLabel } from "@/components/warning-label";
import { PasswordStrengthIndicator } from "./password-strength-indicator";
import { PasswordInput } from "./password-input";

export type GooglePasswordMode = "create" | "recover";

interface GooglePasswordScreenProps {
  mode: GooglePasswordMode;
  password: string;
  onPasswordChange: (password: string) => void;
  onContinue: () => void;
  onForgotPassword?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
  titleOverride?: string;
  subtitleOverride?: string;
  primaryButtonLabelOverride?: string;
  loadingTitleOverride?: string;
  loadingSubtitleOverride?: string;
}

const PASSWORD_CONFIG = {
  create: {
    title: "Protect your wallet",
    subtitle: "Set a password to ensure only you can access your funds.",
    primaryButton: "Create Wallet",
    loadingTitle: "Creating your wallet...",
    loadingSubtitle: "Backing up to Google Drive",
  },
  recover: {
    title: "Wallet found!",
    subtitle: "Enter the password you set during setup to unlock your wallet.",
    primaryButton: "Restore Wallet",
    loadingTitle: "Restoring your wallet...",
    loadingSubtitle: "Downloading from Google Drive",
  },
} as const;

export function GooglePasswordScreen({
  mode,
  password,
  onPasswordChange,
  onContinue,
  onForgotPassword,
  onBack,
  isLoading = false,
  error,
  titleOverride,
  subtitleOverride,
  primaryButtonLabelOverride,
  loadingTitleOverride,
  loadingSubtitleOverride,
}: GooglePasswordScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const baseConfig = PASSWORD_CONFIG[mode];
  const currentConfig = {
    title: titleOverride ?? baseConfig.title,
    subtitle: subtitleOverride ?? baseConfig.subtitle,
    primaryButton: primaryButtonLabelOverride ?? baseConfig.primaryButton,
    loadingTitle: loadingTitleOverride ?? baseConfig.loadingTitle,
    loadingSubtitle: loadingSubtitleOverride ?? baseConfig.loadingSubtitle,
  };

  const validation = useMemo(() => validatePassword(password), [password]);
  const isDisabled =
    mode === "create"
      ? !validation.meetsAllStrengthRequirements
      : password.length === 0;

  function handleContinue() {
    if (isDisabled) return;
    onContinue();
  }

  if (isLoading) {
    return (
      <LoadingView
        title={currentConfig.loadingTitle}
        subtitle={currentConfig.loadingSubtitle}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-surface-tertiary px-8 py-12 dark:bg-neutral-900">
        {onBack && (
          <Button
            variant="outline"
            size="icon"
            onPress={onBack}
            className="mb-4 self-start"
          >
            <ChevronLeft size={20} className="text-secondary" />
          </Button>
        )}
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-[2.5rem] font-matter tracking-tight text-primary dark:text-white">
              {currentConfig.title}
            </Text>
            <Text className="mt-4 pr-7 text-lg text-secondary font-instrument-sans-medium dark:text-neutral-300">
              {currentConfig.subtitle}
            </Text>

            <View className="mt-8">
              <PasswordInput
                password={password}
                showPassword={showPassword}
                onPasswordChange={onPasswordChange}
                onToggleShowPassword={() => setShowPassword((prev) => !prev)}
                error={error}
              />

              {mode === "create" && (
                <PasswordStrengthIndicator password={password} />
              )}
            </View>
          </View>

          <View>
            {mode === "recover" && onForgotPassword && (
              <Button
                variant="link"
                label="Forgot password?"
                onPress={onForgotPassword}
                className="mb-2"
                size="sm"
                textClassName="text-center"
              />
            )}
            {mode === "create" && (
              <WarningLabel label="Warning: This password cannot be reset. Keep it safe." />
            )}
            <Button
              className="mt-6"
              variant="outline"
              size="lg"
              label={currentConfig.primaryButton}
              onPress={handleContinue}
              disabled={isDisabled}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
