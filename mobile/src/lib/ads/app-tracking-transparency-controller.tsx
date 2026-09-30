import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { create } from "zustand";

type TrackingAuthorizationStatus =
  | "unavailable"
  | "undetermined"
  | "granted"
  | "denied";

type AppTrackingTransparencyState = {
  status: TrackingAuthorizationStatus;
  hasResolved: boolean;
  isLoading: boolean;
  error: string | null;
  resolveTrackingAuthorization: () => Promise<TrackingAuthorizationStatus>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unable to resolve app tracking authorization.";
}

export const useAppTrackingTransparencyStore =
  create<AppTrackingTransparencyState>((set) => ({
    status: Platform.OS === "ios" ? "undetermined" : "unavailable",
    hasResolved: Platform.OS !== "ios",
    isLoading: false,
    error: null,

    resolveTrackingAuthorization: async () => {
      if (Platform.OS !== "ios") {
        set({
          status: "unavailable",
          hasResolved: true,
          isLoading: false,
          error: null,
        });
        return "unavailable";
      }

      set({ isLoading: true, error: null });

      try {
        const currentPermission = await getTrackingPermissionsAsync();
        const finalPermission =
          currentPermission.status === "undetermined"
            ? await requestTrackingPermissionsAsync()
            : currentPermission;
        const status =
          finalPermission.status === "granted" ? "granted" : "denied";

        set({
          status,
          hasResolved: true,
          isLoading: false,
          error: null,
        });
        return status;
      } catch (error) {
        const message = getErrorMessage(error);
        set({
          status: "denied",
          hasResolved: true,
          isLoading: false,
          error: message,
        });
        return "denied";
      }
    },
  }));

export function AppTrackingTransparencyController() {
  const resolveTrackingAuthorization = useAppTrackingTransparencyStore(
    (state) => state.resolveTrackingAuthorization,
  );
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    resolveTrackingAuthorization().catch((error) => {
      console.error("[ATT] Tracking authorization failed:", error);
    });
  }, [resolveTrackingAuthorization]);

  return null;
}
