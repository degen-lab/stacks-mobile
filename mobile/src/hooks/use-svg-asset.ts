import { Asset } from "expo-asset";
import { useEffect, useMemo, useState } from "react";

/**
 * Hook to preload SVG assets and get their URI for use with SvgUri.
 * Returns the URI once the asset is loaded, or null if not an SVG or not loaded yet.
 */
export function useSvgAsset(
  imageSource: number | undefined | null,
): string | null {
  const [uri, setUri] = useState<string | null>(null);

  const asset = useMemo(() => {
    if (!imageSource || typeof imageSource !== "number") return null;
    try {
      return Asset.fromModule(imageSource);
    } catch {
      return null;
    }
  }, [imageSource]);

  useEffect(() => {
    if (!asset || asset.type !== "svg") {
      setUri(null);
      return;
    }

    let isMounted = true;

    asset
      .downloadAsync()
      .then(() => {
        if (isMounted) {
          setUri(asset.localUri ?? asset.uri);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUri(asset.uri);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [asset]);

  return uri;
}
