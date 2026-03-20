import { useCallback, useEffect, useState } from "react";

import { getItem, setItem } from "@/lib/storage/storage";

const BRIDGE_TERMS_KEY = "sbtc_bridge_terms_accepted";

export function useBridgeTerms() {
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    getItem<boolean>(BRIDGE_TERMS_KEY).then((val) => {
      setHasAccepted(val === true);
    });
  }, []);

  const acceptTerms = useCallback(async () => {
    await setItem(BRIDGE_TERMS_KEY, true);
    setHasAccepted(true);
  }, []);

  return { hasAccepted, acceptTerms };
}
