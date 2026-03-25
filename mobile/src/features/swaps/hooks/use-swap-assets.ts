import { useMemo } from "react";

import { useSbtcInWallet } from "@/api/dual-stacking/contract";
import { useSwapTokenList, type SwapToken } from "@/api/defi";
import {
  getFungibleTokenBalanceMap,
  getUniqueActiveSwapTokens,
} from "@/api/defi/token-utils";
import { useUserBalances } from "@/api/stacks/use-stacks-api";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import {
  SBTC_TOKEN_ID,
  STX_TOKEN_ID,
  baseUnitsToDisplayString,
} from "@/lib/assets/tokens";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import type { SwapAsset } from "../types";
import { getDefaultSourceTokenId, sortSwapAssets } from "../utils";

function buildSwapAsset(token: SwapToken, balanceBaseUnits: string) {
  return {
    tokenId: token.tokenId,
    symbol: token.symbol,
    name: token.name,
    icon: token.icon,
    decimals: token.tokenDecimals,
    tokenContract: token.tokenContract,
    balanceBaseUnits,
    balanceDisplay: baseUnitsToDisplayString(
      balanceBaseUnits,
      token.tokenDecimals,
    ),
    hasBalance: BigInt(balanceBaseUnits) > 0n,
    usdPrice: token.priceData.last_price,
    token,
  } satisfies SwapAsset;
}

type UseSwapAssetsOptions = {
  enabled?: boolean;
};

export function useSwapAssets(options?: UseSwapAssetsOptions) {
  const { enabled = true } = options ?? {};
  const { stxAddress, isLoading: isWalletLoading } = useWalletAddresses();
  const tokenListQuery = useSwapTokenList({ enabled });
  const balancesQuery = useUserBalances({
    variables: { address: stxAddress ?? "" },
    enabled: enabled && !!stxAddress,
  });
  const sbtcArgs = useMemo(
    () => (enabled ? principalArgFromAddress(stxAddress) : []),
    [enabled, stxAddress],
  );
  const sbtcBalanceQuery = useSbtcInWallet(sbtcArgs);
  const sbtcBalanceBaseUnits = String(sbtcBalanceQuery.data ?? 0);

  const activeTokens = useMemo(() => {
    return getUniqueActiveSwapTokens(tokenListQuery.data);
  }, [tokenListQuery.data]);

  const assets = useMemo(() => {
    const balances = balancesQuery.data;
    const ftBalanceMap = getFungibleTokenBalanceMap(balances);

    return activeTokens
      .map((token) => {
        let balanceBaseUnits = "0";
        if (token.tokenId === SBTC_TOKEN_ID) {
          balanceBaseUnits = sbtcBalanceBaseUnits;
        } else if (balances) {
          if (token.tokenId === STX_TOKEN_ID) {
            balanceBaseUnits = balances.stx.balance;
          } else if (token.tokenContract) {
            balanceBaseUnits =
              ftBalanceMap.get(token.tokenContract.toLowerCase()) ?? "0";
          }
        }
        return buildSwapAsset(token, balanceBaseUnits);
      })
      .sort(sortSwapAssets);
  }, [activeTokens, balancesQuery.data, sbtcBalanceBaseUnits]);

  const assetMap = useMemo(
    () => Object.fromEntries(assets.map((asset) => [asset.tokenId, asset])),
    [assets],
  );

  const defaultSourceTokenId = useMemo(
    () => getDefaultSourceTokenId(assets),
    [assets],
  );

  return {
    stxAddress,
    assets,
    assetMap,
    defaultSourceTokenId,
    isLoading:
      isWalletLoading ||
      tokenListQuery.isLoading ||
      balancesQuery.isLoading ||
      sbtcBalanceQuery.isLoading,
    error:
      tokenListQuery.error ??
      balancesQuery.error ??
      sbtcBalanceQuery.error ??
      null,
  };
}
