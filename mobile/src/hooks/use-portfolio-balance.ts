import { useMemo } from "react";

import { useUserTotalSbtcInDefi } from "@/api/dual-stacking/contract/hooks";
import { useSwapTokenList, type SwapToken } from "@/api/defi";
import { getUniqueActiveSwapTokens } from "@/api/defi/token-utils";
import { useBridgeSbtcBalance } from "@/api/sbtc-bridge";
import { getSbtcBridgeConfig } from "@/api/sbtc-bridge/config";
import {
  useFtMetadataMap,
  type FtMetadata,
} from "@/api/stacks/use-ft-metadata";
import { useUserBalances } from "@/api/stacks/use-stacks-api";
import {
  getPortfolioDisplayDecimals,
  formatPortfolioTokenAmount,
  getPortfolioTotalUsd,
  type PortfolioAssetKind,
  type PortfolioAssetLayer,
  type PortfolioAssetDetail,
  type PortfolioAssetSnapshot,
} from "@/lib/assets/portfolio";
import {
  SBTC_TOKEN_ID,
  STX_TOKEN_ID,
  baseUnitsToDisplayString,
} from "@/lib/assets/tokens";
import { MICRO_STX, fromSatsToBtc } from "@/lib/format/currency";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import { divisorNetwork } from "@/lib/stacks/utils";

import { useBtcPrice } from "@/api/market/use-btc-price";
import { useStacksPrice } from "@/api/market/use-stacks-price";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";

import { useBtcBalance } from "./use-btc-balance";
import { useWalletAddresses } from "./use-wallet-addresses";

type PortfolioAssetMetadata = {
  id: string;
  symbol: string;
  name: string;
  icon: string | null;
  kind: PortfolioAssetKind;
  layer: PortfolioAssetLayer;
  tokenContract: string | null;
  assetIdentifier: string | null;
  swapTokenId: string | null;
  description: string | null;
  decimals: number;
  unitPriceUsd: number | null;
  change24hPercent: number | null;
};

type RawFungibleTokenBalance = {
  assetName: string;
  assetIdentifier: string;
  contractId: string;
  balanceBaseUnits: string;
};

type UsePortfolioBalanceResult = {
  assets: PortfolioAssetSnapshot[];
  usdBalance: number;
  usdBalanceOrNull: number | null;
  hasBalance: boolean;
  stxBalance: number;
  stxLockedBalance: number;
  stxAvailableBalance: number;
  btcBalance: number;
  sbtcBalance: number;
  sbtcDefiBalance: number;
  stxPriceUsd: number | null;
  btcPriceUsd: number | null;
  stxChange24hPercent: number | null;
  btcChange24hPercent: number | null;
  isLoading: boolean;
  isBalanceLoading: boolean;
  isBalanceInitialLoading: boolean;
  isNextStepsBalanceLoading: boolean;
  isBalanceRefreshing: boolean;
  isPriceLoading: boolean;
  btcBalanceOrNull: number | null;
};

const CORE_ASSET_ORDER = {
  BTC: 0,
  STX: 1,
  SBTC: 2,
} as const;

function getAssetValueUsd(amount: number, unitPriceUsd: number | null) {
  return unitPriceUsd != null ? amount * unitPriceUsd : null;
}

function getDisplayAmount(balanceBaseUnits: string, decimals: number) {
  return Number(baseUnitsToDisplayString(balanceBaseUnits, decimals, decimals));
}

function buildPortfolioAsset(
  metadata: PortfolioAssetMetadata,
  balanceBaseUnits: string,
  detail?: PortfolioAssetDetail,
): PortfolioAssetSnapshot {
  const amount = getDisplayAmount(balanceBaseUnits, metadata.decimals);
  const displayDecimals = getPortfolioDisplayDecimals(
    metadata.symbol,
    metadata.decimals,
  );

  return {
    id: metadata.id,
    symbol: metadata.symbol,
    name: metadata.name,
    icon: metadata.icon,
    kind: metadata.kind,
    layer: metadata.layer,
    tokenContract: metadata.tokenContract,
    assetIdentifier: metadata.assetIdentifier,
    swapTokenId: metadata.swapTokenId,
    description: metadata.description,
    amount,
    balanceBaseUnits,
    decimals: metadata.decimals,
    displayDecimals,
    unitPriceUsd: metadata.unitPriceUsd,
    valueUsd: getAssetValueUsd(amount, metadata.unitPriceUsd),
    change24hPercent: metadata.change24hPercent,
    detail,
  };
}

function getCoreAssetOrder(symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  return (
    CORE_ASSET_ORDER[normalizedSymbol as keyof typeof CORE_ASSET_ORDER] ?? 3
  );
}

function sortPortfolioAssets(
  left: PortfolioAssetSnapshot,
  right: PortfolioAssetSnapshot,
) {
  const leftCoreOrder = getCoreAssetOrder(left.symbol);
  const rightCoreOrder = getCoreAssetOrder(right.symbol);

  if (leftCoreOrder !== rightCoreOrder) {
    return leftCoreOrder - rightCoreOrder;
  }

  const leftValueUsd = left.valueUsd ?? -1;
  const rightValueUsd = right.valueUsd ?? -1;

  if (leftValueUsd !== rightValueUsd) {
    return rightValueUsd - leftValueUsd;
  }

  return left.symbol.localeCompare(right.symbol);
}

function getFungibleTokenBalances(
  fungibleTokens:
    | Record<
        string,
        { balance: string; total_received: string; total_sent: string }
      >
    | undefined,
) {
  return Object.entries(fungibleTokens ?? {})
    .map(([assetId, entry]) => {
      const separatorIndex = assetId.indexOf("::");
      if (separatorIndex === -1) return null;

      return {
        assetName: assetId.slice(separatorIndex + 2),
        assetIdentifier: assetId,
        contractId: assetId.slice(0, separatorIndex).toLowerCase(),
        balanceBaseUnits: entry.balance,
      } satisfies RawFungibleTokenBalance;
    })
    .filter(
      (entry): entry is RawFungibleTokenBalance =>
        entry != null && BigInt(entry.balanceBaseUnits) > 0n,
    );
}

function getUnknownTokenMetadata(
  contractId: string,
  assetName: string,
  metadata: FtMetadata | null | undefined,
): PortfolioAssetMetadata | null {
  if (!metadata || !Number.isFinite(metadata.decimals)) {
    return null;
  }

  const symbol = metadata.symbol?.trim() || assetName.toUpperCase();
  const name = metadata.name?.trim() || assetName;
  const icon =
    metadata.image_canonical_uri ??
    metadata.image_uri ??
    metadata.image_thumbnail_uri ??
    null;

  return {
    id: contractId,
    symbol,
    name,
    icon,
    kind: "sip10",
    layer: "stacks",
    tokenContract: contractId,
    assetIdentifier: metadata.asset_identifier ?? `${contractId}::${assetName}`,
    swapTokenId: null,
    description: metadata.description?.trim() ?? null,
    decimals: metadata.decimals,
    unitPriceUsd: null,
    change24hPercent: null,
  };
}

function getSwapTokenMetadata(token: SwapToken): PortfolioAssetMetadata {
  const normalizedSymbol = token.symbol.trim().toUpperCase();
  const isBtcToken =
    normalizedSymbol === "BTC" &&
    token.tokenContract == null &&
    token.layerOneAsset?.isBitcoin;
  const kind: PortfolioAssetKind =
    token.tokenId === STX_TOKEN_ID
      ? "stx"
      : token.tokenId === SBTC_TOKEN_ID
        ? "sbtc"
        : isBtcToken
          ? "btc"
          : "sip10";

  const layer: PortfolioAssetLayer = isBtcToken ? "bitcoin" : "stacks";

  return {
    id: token.tokenId,
    symbol: token.symbol,
    name: token.name,
    icon: token.icon,
    kind,
    layer,
    tokenContract: token.tokenContract,
    assetIdentifier:
      token.tokenContract && token.tokenName
        ? `${token.tokenContract}::${token.tokenName}`
        : token.tokenContract,
    swapTokenId: token.tokenId,
    description: null,
    decimals: token.tokenDecimals,
    unitPriceUsd: token.priceData.last_price,
    change24hPercent: token.priceData["24h_change"],
  };
}

export function usePortfolioBalance(): UsePortfolioBalanceResult {
  const { activeAccountIndex } = useActiveAccountIndex();
  const { selectedNetwork } = useSelectedNetwork();
  const { stxAddress, isLoading: isWalletLoading } = useWalletAddresses({
    accountIndex: activeAccountIndex,
  });
  const balancesQuery = useUserBalances({
    variables: { address: stxAddress ?? "" },
    enabled: !!stxAddress,
    refetchInterval: 30_000,
  });
  const {
    balance: btcBalance,
    balanceOrNull: btcBalanceOrNull,
    balanceSats: btcBalanceSats,
    isLoading: loadingBtc,
    isFetching: fetchingBtc,
  } = useBtcBalance(activeAccountIndex);
  const tokenListQuery = useSwapTokenList();
  const config = useMemo(
    () => getSbtcBridgeConfig(selectedNetwork),
    [selectedNetwork],
  );
  const principal = useMemo(
    () => principalArgFromAddress(stxAddress),
    [stxAddress],
  );
  const {
    data: sbtcBalanceSats,
    isLoading: loadingSbtc,
    isFetching: fetchingSbtc,
  } = useBridgeSbtcBalance(config, principal, !!stxAddress);
  const sbtcBalance = useMemo(
    () => fromSatsToBtc(sbtcBalanceSats ?? 0n),
    [sbtcBalanceSats],
  );
  const {
    data: sbtcDefiBalanceSats,
    isLoading: loadingSbtcDefi,
    isFetching: fetchingSbtcDefi,
  } = useUserTotalSbtcInDefi(principal);
  const sbtcDefiBalance = useMemo(
    () => fromSatsToBtc(sbtcDefiBalanceSats ?? 0) / divisorNetwork,
    [sbtcDefiBalanceSats],
  );
  const { data: stxMarketData, isLoading: loadingStxPrice } = useStacksPrice();
  const { data: btcMarketData, isLoading: loadingBtcPrice } = useBtcPrice();
  const stxPriceUsd = stxMarketData?.usd ?? null;
  const btcPriceUsd = btcMarketData?.usd ?? null;
  const stxChange24hPercent = stxMarketData?.change24h ?? null;
  const btcChange24hPercent = btcMarketData?.change24h ?? null;
  const activeTokens = useMemo(
    () => getUniqueActiveSwapTokens(tokenListQuery.data),
    [tokenListQuery.data],
  );
  const activeTokensByContract = useMemo(() => {
    const contractMap = new Map<string, SwapToken>();

    for (const token of activeTokens) {
      if (!token.tokenContract) continue;
      contractMap.set(token.tokenContract.toLowerCase(), token);
    }

    return contractMap;
  }, [activeTokens]);
  const activeTokensBySymbol = useMemo(() => {
    const symbolMap = new Map<string, SwapToken>();

    for (const token of activeTokens) {
      const normalizedSymbol = token.symbol.trim().toUpperCase();
      if (symbolMap.has(normalizedSymbol)) continue;
      symbolMap.set(normalizedSymbol, token);
    }

    return symbolMap;
  }, [activeTokens]);
  const sbtcToken = activeTokensBySymbol.get("SBTC") ?? null;
  const stxBalanceData = useMemo(() => {
    const stx = balancesQuery.data?.stx;
    if (!stx) {
      return {
        stxBalance: 0,
        stxLockedBalance: 0,
        stxAvailableBalance: 0,
      };
    }

    const totalBalance = Number(stx.balance) / MICRO_STX;
    const lockedBalance = Number(stx.locked) / MICRO_STX;

    return {
      stxBalance: totalBalance,
      stxLockedBalance: lockedBalance,
      stxAvailableBalance: totalBalance - lockedBalance,
    };
  }, [balancesQuery.data]);
  const rawFungibleTokenBalances = useMemo(
    () => getFungibleTokenBalances(balancesQuery.data?.fungible_tokens),
    [balancesQuery.data?.fungible_tokens],
  );
  const unknownTokenContracts = useMemo(
    () => [
      ...new Set(
        rawFungibleTokenBalances
          .filter((token) => !activeTokensByContract.has(token.contractId))
          .map((token) => token.contractId),
      ),
    ],
    [activeTokensByContract, rawFungibleTokenBalances],
  );
  const ftMetadataQuery = useFtMetadataMap({
    variables: { principals: unknownTokenContracts },
    enabled: unknownTokenContracts.length > 0,
  });
  const hasDetectedBalance =
    stxBalanceData.stxBalance > 0 ||
    btcBalance > 0 ||
    sbtcBalance > 0 ||
    sbtcDefiBalance > 0 ||
    rawFungibleTokenBalances.length > 0;
  const assets = useMemo(() => {
    const nextAssets: PortfolioAssetSnapshot[] = [];

    nextAssets.push(
      buildPortfolioAsset(
        {
          id: "btc",
          symbol: "BTC",
          name: "Bitcoin",
          icon: null,
          kind: "btc",
          layer: "bitcoin",
          tokenContract: null,
          assetIdentifier: null,
          swapTokenId: activeTokensBySymbol.get("BTC")?.tokenId ?? null,
          description: null,
          decimals: 8,
          unitPriceUsd: btcPriceUsd,
          change24hPercent: btcChange24hPercent,
        },
        String(btcBalanceSats),
      ),
    );

    nextAssets.push(
      buildPortfolioAsset(
        {
          id: "stx",
          symbol: "STX",
          name: "Stacks",
          icon: null,
          kind: "stx",
          layer: "stacks",
          tokenContract: null,
          assetIdentifier: null,
          swapTokenId: activeTokensBySymbol.get("STX")?.tokenId ?? STX_TOKEN_ID,
          description: null,
          decimals: 6,
          unitPriceUsd: stxPriceUsd,
          change24hPercent: stxChange24hPercent,
        },
        balancesQuery.data?.stx.balance ?? "0",
        stxBalanceData.stxLockedBalance > 0
          ? {
              label: "Locked",
              value: `${formatPortfolioTokenAmount(
                stxBalanceData.stxLockedBalance,
                2,
              )} STX`,
            }
          : undefined,
      ),
    );

    nextAssets.push(
      buildPortfolioAsset(
        {
          id: "sbtc",
          symbol: "sBTC",
          name: "sBTC",
          icon: null,
          kind: "sbtc",
          layer: "stacks",
          tokenContract: sbtcToken?.tokenContract ?? null,
          assetIdentifier:
            sbtcToken?.tokenContract && sbtcToken.tokenName
              ? `${sbtcToken.tokenContract}::${sbtcToken.tokenName}`
              : (sbtcToken?.tokenContract ?? null),
          swapTokenId: sbtcToken?.tokenId ?? SBTC_TOKEN_ID,
          description: null,
          decimals: 8,
          unitPriceUsd: btcPriceUsd,
          change24hPercent: btcChange24hPercent,
        },
        String((sbtcBalanceSats ?? 0n) + BigInt(sbtcDefiBalanceSats ?? 0)),
        sbtcDefiBalance > 0
          ? {
              label: "In DeFi",
              value: `${formatPortfolioTokenAmount(sbtcDefiBalance, 8)} sBTC`,
            }
          : undefined,
      ),
    );

    for (const tokenBalance of rawFungibleTokenBalances) {
      const knownToken = activeTokensByContract.get(tokenBalance.contractId);
      if (knownToken?.tokenId === SBTC_TOKEN_ID) continue;

      const metadata = knownToken
        ? getSwapTokenMetadata(knownToken)
        : getUnknownTokenMetadata(
            tokenBalance.contractId,
            tokenBalance.assetName,
            ftMetadataQuery.data?.[tokenBalance.contractId] ?? null,
          );

      if (!metadata) continue;

      nextAssets.push(
        buildPortfolioAsset(metadata, tokenBalance.balanceBaseUnits),
      );
    }

    return nextAssets.sort(sortPortfolioAssets);
  }, [
    activeTokensByContract,
    activeTokensBySymbol,
    balancesQuery.data?.stx.balance,
    btcBalanceSats,
    btcChange24hPercent,
    btcPriceUsd,
    ftMetadataQuery.data,
    rawFungibleTokenBalances,
    sbtcBalanceSats,
    sbtcDefiBalance,
    sbtcDefiBalanceSats,
    sbtcToken,
    stxBalanceData.stxLockedBalance,
    stxChange24hPercent,
    stxPriceUsd,
  ]);

  const usdBalanceOrNull = useMemo(() => {
    if (!assets.length) return hasDetectedBalance ? null : 0;

    const hasKnownValuation = assets.some((asset) => asset.valueUsd != null);
    if (!hasKnownValuation) return null;

    return getPortfolioTotalUsd(assets);
  }, [assets, hasDetectedBalance]);

  const usdBalance = usdBalanceOrNull ?? 0;

  const hasBalance = useMemo(() => hasDetectedBalance, [hasDetectedBalance]);

  const isBalanceInitialLoading =
    isWalletLoading ||
    balancesQuery.isLoading ||
    loadingBtc ||
    loadingSbtc ||
    loadingSbtcDefi;
  const isNextStepsBalanceLoading =
    isWalletLoading ||
    balancesQuery.isLoading ||
    loadingSbtc ||
    loadingSbtcDefi;
  const isBalanceRefreshing =
    balancesQuery.isFetching || fetchingBtc || fetchingSbtc || fetchingSbtcDefi;

  const isPriceLoading = loadingStxPrice || loadingBtcPrice;
  const isAssetLoading =
    tokenListQuery.isLoading ||
    (unknownTokenContracts.length > 0 && ftMetadataQuery.isLoading);

  return {
    assets,
    usdBalance,
    usdBalanceOrNull,
    hasBalance,
    stxBalance: stxBalanceData.stxBalance,
    stxLockedBalance: stxBalanceData.stxLockedBalance,
    stxAvailableBalance: stxBalanceData.stxAvailableBalance,
    btcBalance,
    btcBalanceOrNull,
    sbtcBalance,
    sbtcDefiBalance,
    stxPriceUsd,
    btcPriceUsd,
    stxChange24hPercent,
    btcChange24hPercent,
    isLoading: isBalanceInitialLoading || isPriceLoading || isAssetLoading,
    isBalanceLoading: isBalanceInitialLoading,
    isBalanceInitialLoading,
    isNextStepsBalanceLoading,
    isBalanceRefreshing,
    isPriceLoading,
  };
}
