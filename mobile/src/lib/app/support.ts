import Constants from "expo-constants";
import { Linking, Platform } from "react-native";

import { copyToClipboard } from "@/lib/clipboard";
import { Env } from "@/lib/env";

export const SUPPORT_EMAIL = "notify@degenlab.io";

export function buildBugReportMailtoUrl() {
  const version = Constants.expoConfig?.version ?? Env.VERSION ?? "unknown";
  const deviceName = Constants.deviceName ?? "Unknown";
  const osVersion = String(Platform.Version);

  const subject = `Bug report - Enter Stacks ${version}`;
  const body = [
    "What happened?",
    "",
    "Steps to reproduce:",
    "1. ",
    "2. ",
    "",
    "Expected result:",
    "",
    "Actual result:",
    "",
    "---",
    `App version: ${version}`,
    `Device: ${deviceName}`,
    `Platform: ${Platform.OS} ${osVersion}`,
    `Network: ${Env.NETWORK ?? "unknown"}`,
  ].join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function openBugReportEmail() {
  const mailtoUrl = buildBugReportMailtoUrl();

  try {
    const canOpen = await Linking.canOpenURL(mailtoUrl);

    if (canOpen) {
      await Linking.openURL(mailtoUrl);
      return;
    }
  } catch (error) {
    console.error("Failed to open bug report email", error);
  }

  await copyToClipboard(
    SUPPORT_EMAIL,
    "No mail app available. Support email copied",
  );
}
