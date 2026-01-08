import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import React from "react";

import { Options, useModal } from "@/components/ui";
import type { OptionType } from "@/components/ui/select";
import { useSelectedNetwork } from "@/lib/store/settings";

import { Item } from "./item";

const NETWORK_OPTIONS: OptionType[] = [
  { label: "Mainnet", value: "mainnet" as NetworkType },
  { label: "Testnet", value: "testnet" as NetworkType },
  { label: "Devnet", value: "devnet" as NetworkType },
];

export const NetworkItem = () => {
  const { selectedNetwork, setSelectedNetwork } = useSelectedNetwork();
  const modal = useModal();

  const onSelect = React.useCallback(
    async (option: OptionType) => {
      await setSelectedNetwork(option.value as NetworkType);
      modal.dismiss();
    },
    [setSelectedNetwork, modal],
  );

  const selectedLabel =
    NETWORK_OPTIONS.find((option) => option.value === selectedNetwork)?.label ??
    selectedNetwork;

  return (
    <>
      <Item label="Networks" value={selectedLabel} onPress={modal.present} />
      <Options
        ref={modal.ref}
        options={NETWORK_OPTIONS}
        onSelect={onSelect}
        value={selectedNetwork}
      />
    </>
  );
};
