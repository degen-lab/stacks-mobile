import React from "react";

import { OrDivider } from "@/components/or-divider";
import { Button, View } from "@/components/ui";
import { Env } from "@/lib/env";

type TransactionFundingActionsProps = {
  sponsoredLabel?: string;
  adsRequired?: number;
  walletLabel: string;
  onPressSponsored?: () => void;
  onPressWallet: () => void;
  sponsoredDisabled?: boolean;
  walletDisabled?: boolean;
  sponsoredLoading?: boolean;
  walletLoading?: boolean;
};

export function TransactionFundingActions({
  sponsoredLabel,
  adsRequired,
  walletLabel,
  onPressSponsored,
  onPressWallet,
  sponsoredDisabled = false,
  walletDisabled = false,
  sponsoredLoading = false,
  walletLoading = false,
}: TransactionFundingActionsProps) {
  const adsEnabled = Env.ADS_ENABLED === "true";
  const derivedSponsoredLabel = !adsEnabled
    ? "Watch an ad (Coming Soon)"
    : (sponsoredLabel ??
      (adsRequired && adsRequired > 1
        ? `Watch ${adsRequired} ads`
        : "Watch an ad"));
  const showSponsored = typeof onPressSponsored === "function";

  return (
    <View className="mt-6 gap-6">
      {showSponsored ? (
        <>
          <Button
            label={derivedSponsoredLabel}
            onPress={onPressSponsored}
            disabled={!adsEnabled || sponsoredDisabled || walletLoading}
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
