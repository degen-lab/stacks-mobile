import { useState, useEffect } from "react";
import { walletKit } from "@/lib/stacks/wallet";
import { useSelectedNetwork } from "@/lib/store/settings";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { getAddressForNetwork } from "@/lib/stacks/addresses";
import { getBitcoinAddressForAccount } from "@/lib/bitcoin/addresses";

type UseWalletAddressesOptions = {
  accountIndex?: number;
};

export function useWalletAddresses(options: UseWalletAddressesOptions = {}) {
  const { accountIndex = 0 } = options;
  const { selectedNetwork } = useSelectedNetwork();
  const [stxAddress, setStxAddress] = useState<string | null>(null);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAddresses = async () => {
      try {
        const accounts = await walletKit.getWalletAccounts();
        const account = accounts[accountIndex];

        // Load STX address
        const stxAddr = account
          ? getAddressForNetwork(account, selectedNetwork)
          : null;
        if (mounted) setStxAddress(stxAddr);

        // Always load BTC address
        const btcAddr = await getBitcoinAddressForAccount(
          accountIndex,
          selectedNetwork,
        );
        if (mounted) setBtcAddress(btcAddr);
      } catch (e) {
        console.error("Failed to load wallet addresses", e);
        if (mounted) {
          setStxAddress(null);
          setBtcAddress(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadAddresses();
    return () => {
      mounted = false;
    };
  }, [accountIndex, selectedNetwork]);

  return {
    stxAddress,
    btcAddress,
    walletKit,
    network: selectedNetwork as NetworkType,
    isLoading,
  };
}
