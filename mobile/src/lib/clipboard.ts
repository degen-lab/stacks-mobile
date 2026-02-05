import * as Clipboard from "expo-clipboard";
import { showMessage } from "react-native-flash-message";

/**
 * Copy text to clipboard with visual feedback
 */
export async function copyToClipboard(
  text: string,
  message: string = "Copied to clipboard",
): Promise<void> {
  try {
    await Clipboard.setStringAsync(text);
    showMessage({
      message,
      type: "success",
      duration: 1500,
    });
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    showMessage({
      message: "Failed to copy",
      type: "danger",
    });
  }
}
