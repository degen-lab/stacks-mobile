import React from "react";
import { Alert } from "react-native";

import { Options, useModal } from "@/components/ui";
import type { OptionType } from "@/components/ui/select";
import {
  authenticateWithBiometrics,
  checkBiometricAvailability,
} from "@/lib/security/local-auth";
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
      const nextMethod = option.value as "none" | "biometrics";

      if (nextMethod === "biometrics") {
        const availability = await checkBiometricAvailability();

        if (!availability.available) {
          Alert.alert(
            "Biometrics Unavailable",
            availability.message ??
              "Biometric authentication is not available on this device.",
          );
          return;
        }

        const trial = await authenticateWithBiometrics({
          promptMessage: "Verify biometrics to enable",
        });

        if (!trial.success) {
          if (trial.reason !== "canceled") {
            Alert.alert("Biometrics Failed", trial.message);
          }
          return;
        }
      }

      await setSecurityMethod(nextMethod);
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
