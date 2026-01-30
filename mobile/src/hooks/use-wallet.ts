import { useState, useEffect } from "react";
import { walletKit } from "@/lib/stacks/wallet";
import { useSelectedNetwork } from "@/lib/store/settings";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";

export function useWallet() {
  const { selectedNetwork } = useSelectedNetwork();
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAccount = async () => {
      try {
        const accounts = await walletKit.getWalletAccounts();
        if (mounted && accounts && accounts.length > 0) {
          setAddress(accounts[0].address);
        }
      } catch (e) {
        console.error("Failed to load wallet account", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadAccount();
    return () => {
      mounted = false;
    };
  }, [selectedNetwork]);

  return {
    address,
    walletKit,
    network: selectedNetwork as NetworkType,
    isLoading,
  };
}
