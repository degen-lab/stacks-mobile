import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export function useHaptics() {
  const trigger = useCallback(
    (
      type:
        | "success"
        | "error"
        | "warning"
        | "light"
        | "medium"
        | "heavy" = "light",
    ) => {
      switch (type) {
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "error":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case "warning":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    },
    [],
  );

  return trigger;
}
