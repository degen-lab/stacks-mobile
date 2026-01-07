import React from "react";

import { Options, useModal } from "@/components/ui";
import type { OptionType } from "@/components/ui/select";

import { Item } from "./item";

const HELP_OPTIONS: OptionType[] = [
  { label: "Privacy Policy", value: "privacy-policy" },
  { label: "Terms of Service", value: "terms-of-service" },
  { label: "Report a Bug", value: "report-bug" },
];

export const HelpItem = () => {
  const modal = useModal();

  const onSelect = React.useCallback(
    async (option: OptionType) => {
      modal.dismiss();

      // TODO: Implement actual navigation/actions for each option
      switch (option.value) {
        case "privacy-policy":
          // TODO: Navigate to privacy policy page or open external link
          // Example: await Linking.openURL("https://example.com/privacy");
          break;
        case "terms-of-service":
          // TODO: Navigate to terms of service page or open external link
          // Example: await Linking.openURL("https://example.com/terms");
          break;
        case "report-bug":
          // TODO: Open bug report form or email client
          // Example: await Linking.openURL("mailto:support@example.com");
          break;
      }
    },
    [modal],
  );

  return (
    <>
      <Item label="Help" onPress={modal.present} />
      <Options ref={modal.ref} options={HELP_OPTIONS} onSelect={onSelect} />
    </>
  );
};
