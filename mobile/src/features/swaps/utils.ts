import type {
  SerializedPostCondition,
  SwapContractCallParams,
  SwapToken,
} from "@/api/defi";
import {
  SBTC_TOKEN_ID,
  STX_TOKEN_ID,
  compareBaseUnitAmounts,
} from "@/lib/assets/tokens";
import type { SwapAsset } from "./types";

export function displayAmountToBaseUnits(
  input: string,
  decimals: number,
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const [wholePartRaw = "0", fractionRaw = ""] = trimmed.split(".");
  const wholePart = wholePartRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionRaw.slice(0, decimals).padEnd(decimals, "0");
  const combined = `${wholePart}${fraction}`.replace(/^0+(?=\d)/, "");

  return combined || "0";
}

export function sortSwapAssets(left: SwapAsset, right: SwapAsset) {
  if (left.hasBalance !== right.hasBalance) {
    return left.hasBalance ? -1 : 1;
  }

  if (left.tokenId === STX_TOKEN_ID && right.tokenId !== STX_TOKEN_ID)
    return -1;
  if (right.tokenId === STX_TOKEN_ID && left.tokenId !== STX_TOKEN_ID) return 1;
  if (left.tokenId === SBTC_TOKEN_ID && right.tokenId !== SBTC_TOKEN_ID)
    return -1;
  if (right.tokenId === SBTC_TOKEN_ID && left.tokenId !== SBTC_TOKEN_ID)
    return 1;

  const leftUsd = Number(left.balanceDisplay || "0") * (left.usdPrice ?? 0);
  const rightUsd = Number(right.balanceDisplay || "0") * (right.usdPrice ?? 0);

  if (leftUsd !== rightUsd) {
    return rightUsd - leftUsd;
  }

  if (left.hasBalance && right.hasBalance) {
    return compareBaseUnitAmounts(
      right.balanceBaseUnits,
      left.balanceBaseUnits,
    );
  }

  return left.symbol.localeCompare(right.symbol);
}

export function getDefaultSourceTokenId(assets: SwapAsset[]) {
  if (!assets.length) return "";

  const stxAsset = assets.find((asset) => asset.tokenId === STX_TOKEN_ID);
  const firstOwnedAsset = assets.find((asset) => asset.hasBalance);

  return firstOwnedAsset?.tokenId ?? stxAsset?.tokenId ?? assets[0].tokenId;
}

export function getMinimumReceivedBaseUnits(
  contractCallParams: SwapContractCallParams | null | undefined,
  destinationToken: SwapToken | null | undefined,
) {
  if (!contractCallParams || !destinationToken) {
    return null;
  }

  if (destinationToken.tokenId === STX_TOKEN_ID) {
    const outputPostCondition = [...contractCallParams.postConditions]
      .reverse()
      .find(
        (
          postCondition,
        ): postCondition is Extract<
          SerializedPostCondition,
          { type: "stx-postcondition" }
        > =>
          postCondition.type === "stx-postcondition" &&
          postCondition.condition !== "eq" &&
          postCondition.amount !== "0",
      );

    return outputPostCondition?.amount ?? null;
  }

  if (!destinationToken.tokenContract) {
    return null;
  }

  const assetPrefix = `${destinationToken.tokenContract.toLowerCase()}::`;
  const outputPostCondition = [...contractCallParams.postConditions]
    .reverse()
    .find(
      (
        postCondition,
      ): postCondition is Extract<
        SerializedPostCondition,
        { type: "ft-postcondition" }
      > =>
        postCondition.type === "ft-postcondition" &&
        postCondition.amount !== "0" &&
        postCondition.asset.toLowerCase().startsWith(assetPrefix),
    );

  return outputPostCondition?.amount ?? null;
}
