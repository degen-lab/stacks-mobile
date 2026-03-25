import type { Href } from "expo-router";

import type { EarnAssetSnapshot } from "../types";

type SearchParamValue = string | string[] | undefined;

function getFirstSearchParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function buildEarnAssetRoute(asset: EarnAssetSnapshot): Href {
  return {
    pathname: "/Earn/assets/[assetId]",
    params: {
      assetId: asset.id,
      assetLabel: asset.name.trim() || asset.symbol.trim() || "Asset",
    },
  };
}

export function getEarnAssetBreadcrumbLabel(assetLabel: SearchParamValue) {
  return getFirstSearchParam(assetLabel)?.trim() || "Asset";
}
