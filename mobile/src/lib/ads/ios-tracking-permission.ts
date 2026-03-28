import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { Alert } from "react-native";

export type IosAdTrackingStatus = "granted" | "denied" | "declined";

function showPrePrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    Alert.alert(
      "Allow personalized ads?",
      "iOS will ask for tracking permission. If you decline, sponsored transactions will still work with non-personalized ads.",
      [
        {
          text: "Keep non-personalized ads",
          style: "cancel",
          onPress: () => settle(false),
        },
        { text: "Continue", onPress: () => settle(true) },
      ],
      { cancelable: true, onDismiss: () => settle(false) },
    );
  });
}

export async function requestIosAdTracking(): Promise<IosAdTrackingStatus> {
  const { status } = await getTrackingPermissionsAsync();

  if (status !== "undetermined") {
    return status === "granted" ? "granted" : "denied";
  }

  if (!(await showPrePrompt())) return "declined";

  const { status: finalStatus } = await requestTrackingPermissionsAsync();
  return finalStatus === "granted" ? "granted" : "denied";
}
