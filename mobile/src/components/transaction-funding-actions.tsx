import React from "react";

import { OrDivider } from "@/components/or-divider";
import { Button, View } from "@/components/ui";

type TransactionFundingActionsProps = {
  sponsoredLabel?: string;
  walletLabel: string;
  onPressSponsored?: () => void;
  onPressWallet: () => void;
  sponsoredDisabled?: boolean;
  walletDisabled?: boolean;
  sponsoredLoading?: boolean;
  walletLoading?: boolean;
};

export function TransactionFundingActions({
  sponsoredLabel = "Watch an ad",
  walletLabel,
  onPressSponsored,
  onPressWallet,
  sponsoredDisabled = false,
  walletDisabled = false,
  sponsoredLoading = false,
  walletLoading = false,
}: TransactionFundingActionsProps) {
  const showSponsored = typeof onPressSponsored === "function";

  return (
    <View className="mt-6 gap-6">
      {showSponsored ? (
        <>
          <Button
            label={sponsoredLabel}
            onPress={onPressSponsored}
            disabled={sponsoredDisabled || walletLoading}
            loading={sponsoredLoading}
            variant="gamePrimary"
            size="game"
          />
          <OrDivider />
        </>
      ) : null}

      <Button
        label={walletLabel}
        onPress={onPressWallet}
        disabled={walletDisabled || sponsoredLoading}
        loading={walletLoading}
        variant="gameOutline"
        className="rounded-none"
        size="game"
      />
    </View>
  );
}
