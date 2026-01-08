import React from "react";

import { Options, useModal } from "@/components/ui";
import type { OptionType } from "@/components/ui/select";
import { useSecurityMethod } from "@/lib/store/settings";

import { Item } from "./item";

const SECURITY_OPTIONS: OptionType[] = [
  { label: "None", value: "none" },
  { label: "Biometrics", value: "biometrics" },
];

export const SecurityItem = () => {
  const modal = useModal();
  const { securityMethod, setSecurityMethod } = useSecurityMethod();

  const selectedLabel =
    SECURITY_OPTIONS.find((option) => option.value === securityMethod)?.label ??
    "None";

  const onSelect = React.useCallback(
    async (option: OptionType) => {
      await setSecurityMethod(option.value as "none" | "biometrics");
      modal.dismiss();
    },
    [modal, setSecurityMethod],
  );

  return (
    <>
      <Item label="Security" value={selectedLabel} onPress={modal.present} />
      <Options
        ref={modal.ref}
        options={SECURITY_OPTIONS}
        onSelect={onSelect}
        value={securityMethod}
      />
    </>
  );
};
