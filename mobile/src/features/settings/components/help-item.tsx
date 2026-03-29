import React from "react";

import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { showMessage } from "react-native-flash-message";
import { Options, useModal } from "@/components/ui";
import type { OptionType } from "@/components/ui/select";
import { PRIVACY_URL, TERMS_URL } from "@/lib/app/links";
import { openBugReportEmail } from "@/lib/app/support";

import { Item } from "./item";

const HELP_OPTIONS: OptionType[] = [
  { label: "Privacy Policy", value: "privacy-policy" },
  { label: "Terms of Service", value: "terms-of-service" },
  { label: "Report a Bug", value: "report-bug" },
];

export const HelpItem = () => {
  const modal = useModal();

  const openWebsiteUrl = React.useCallback(async (url: string) => {
    await openBrowserAsync(url, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  }, []);

  const onSelect = React.useCallback(
    async (option: OptionType) => {
      modal.dismiss();

      try {
        switch (option.value) {
          case "privacy-policy":
            await openWebsiteUrl(PRIVACY_URL);
            break;
          case "terms-of-service":
            await openWebsiteUrl(TERMS_URL);
            break;
          case "report-bug":
            await openBugReportEmail();
            break;
        }
      } catch (error) {
        console.error("Failed to open help action", error);
        showMessage({
          message: "Couldn't open that action",
          type: "danger",
          duration: 4000,
        });
      }
    },
    [modal, openWebsiteUrl],
  );

  return (
    <>
      <Item label="Help" onPress={modal.present} />
      <Options ref={modal.ref} options={HELP_OPTIONS} onSelect={onSelect} />
    </>
  );
};
