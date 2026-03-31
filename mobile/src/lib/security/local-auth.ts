import * as LocalAuthentication from "expo-local-authentication";

type BiometricAvailability = {
  available: boolean;
  message?: string;
};

export type BiometricAuthResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: "canceled" | "unavailable" | "failed" | "error";
      message: string;
    };

type AuthenticateOptions = {
  promptMessage: string;
  cancelLabel?: string;
};

const DEFAULT_FAILURE_MESSAGE =
  "Biometric authentication failed. Please try again.";

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();

  if (!hasHardware) {
    return {
      available: false,
      message: "Biometric authentication is not available on this device.",
    };
  }

  const supportedTypes =
    await LocalAuthentication.supportedAuthenticationTypesAsync();

  if (supportedTypes.length === 0) {
    return {
      available: false,
      message: "Biometric authentication is not available on this device.",
    };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!isEnrolled) {
    return {
      available: false,
      message:
        "Set up Face ID, Touch ID, or another biometric method to use this security option.",
    };
  }

  return { available: true };
}

function getFailureMessage(error?: string, warning?: string) {
  switch (error) {
    case "user_cancel":
    case "system_cancel":
    case "app_cancel":
      return {
        reason: "canceled" as const,
        message: "Authentication canceled.",
      };
    case "not_enrolled":
      return {
        reason: "unavailable" as const,
        message:
          "Set up Face ID, Touch ID, or your device passcode to continue.",
      };
    case "lockout":
      return {
        reason: "failed" as const,
        message:
          "Biometric authentication is temporarily locked. Use your device passcode and try again.",
      };
    case "user_fallback":
      return {
        reason: "canceled" as const,
        message: "Authentication canceled.",
      };
    default:
      return {
        reason: "failed" as const,
        message: warning || DEFAULT_FAILURE_MESSAGE,
      };
  }
}

export async function authenticateWithBiometrics({
  promptMessage,
  cancelLabel = "Cancel",
}: AuthenticateOptions): Promise<BiometricAuthResult> {
  const availability = await checkBiometricAvailability();

  if (!availability.available) {
    return {
      success: false,
      reason: "unavailable",
      message:
        availability.message ?? "Biometric authentication is unavailable.",
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel,
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    const failure = getFailureMessage(result.error, result.warning);
    return {
      success: false,
      reason: failure.reason,
      message: failure.message,
    };
  } catch (error) {
    console.error("Biometric authentication failed:", error);
    return {
      success: false,
      reason: "error",
      message: DEFAULT_FAILURE_MESSAGE,
    };
  }
}
