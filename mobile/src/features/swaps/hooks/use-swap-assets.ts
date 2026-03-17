import { useMemo } from "react";

import { useSwapTokenList, type SwapToken } from "@/api/defi";
import { useUserBalances } from "@/api/stacks/use-stacks-api";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import type { SwapAsset } from "../types";
import {
  STX_TOKEN_ID,
  baseUnitsToDisplayString,
  getDefaultSourceTokenId,
  sortSwapAssets,
} from "../utils";

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
    enabled: !!stxAddress,
  });

  const activeTokens = useMemo(() => {
    const uniqueTokens = new Map<string, SwapToken>();

    for (const token of tokenListQuery.data ?? []) {
      if (token.status.toLowerCase() !== "active") continue;
      if (uniqueTokens.has(token.tokenId)) continue;

      uniqueTokens.set(token.tokenId, token);
    }

    return [...uniqueTokens.values()];
  }, [tokenListQuery.data]);

  const assets = useMemo(() => {
    const balances = balancesQuery.data;

    // Build a prefix→balance map once (O(M)) instead of scanning per token (O(N×M))
    const ftBalanceMap = new Map<string, string>();
    if (balances) {
      for (const [assetId, entry] of Object.entries(balances.fungible_tokens)) {
        const sep = assetId.indexOf("::");
        if (sep !== -1)
          ftBalanceMap.set(assetId.slice(0, sep).toLowerCase(), entry.balance);
      }
    }

    return activeTokens
      .map((token) => {
        let balanceBaseUnits = "0";
        if (balances) {
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
  }, [activeTokens, balancesQuery.data]);

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
      isWalletLoading || tokenListQuery.isLoading || balancesQuery.isLoading,
    error: tokenListQuery.error ?? balancesQuery.error ?? null,
  };
}
