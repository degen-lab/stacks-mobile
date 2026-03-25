import type { AddressBalanceResponse } from "@/api/stacks/types/user-balances";

import type { SwapToken } from "./types";

export function getUniqueActiveSwapTokens(
  tokens: SwapToken[] | null | undefined,
) {
  const uniqueTokens = new Map<string, SwapToken>();

  for (const token of tokens ?? []) {
    if (token.status.toLowerCase() !== "active") continue;
    if (uniqueTokens.has(token.tokenId)) continue;

    uniqueTokens.set(token.tokenId, token);
  }

  return [...uniqueTokens.values()];
}

export function getFungibleTokenBalanceMap(
  balances: AddressBalanceResponse | null | undefined,
) {
  const ftBalanceMap = new Map<string, string>();

  if (!balances) return ftBalanceMap;

  for (const [assetId, entry] of Object.entries(balances.fungible_tokens)) {
    const separatorIndex = assetId.indexOf("::");
    if (separatorIndex === -1) continue;

    ftBalanceMap.set(
      assetId.slice(0, separatorIndex).toLowerCase(),
      entry.balance,
    );
  }

  return ftBalanceMap;
}
