import { useCallback, useEffect, useState } from "react";

type UseBtcBalanceResult = {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Mock BTC balance hook
 * TODO: Replace with real Bitcoin balance fetching when BTC addresses are derived
 */
export const useBtcBalance = (): UseBtcBalanceResult => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock balance: 0.00123456 BTC
      setBalance(0.00123456);
    } catch (err) {
      console.error("[BTC Balance] Failed to load", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { balance, isLoading, error, refresh };
};
