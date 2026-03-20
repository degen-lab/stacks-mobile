import { useState, useEffect } from "react";
import { walletKit } from "@/lib/stacks/wallet";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { getAddressForNetwork } from "@/lib/stacks/addresses";
import { getBitcoinAddressForAccount } from "@/lib/bitcoin/addresses";

type UseWalletAddressesOptions = {
  accountIndex?: number;
};

export function useWalletAddresses(options: UseWalletAddressesOptions = {}) {
  const { accountIndex: requestedAccountIndex } = options;
  const { selectedNetwork } = useSelectedNetwork();
  const { activeAccountIndex } = useActiveAccountIndex();
  const accountIndex = requestedAccountIndex ?? activeAccountIndex;
  const [stxAddress, setStxAddress] = useState<string | null>(null);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAddresses = async () => {
      try {
        if (mounted) {
          setIsLoading(true);
          setStxAddress(null);
          setBtcAddress(null);
        }

        const accounts = await walletKit.getWalletAccounts();
        const account =
          accounts.find((account) => account.index === accountIndex) ?? null;

        if (!account) {
          if (mounted) {
            setStxAddress(null);
            setBtcAddress(null);
          }
          return;
        }

        // Load STX address
        const stxAddr = getAddressForNetwork(account, selectedNetwork);
        if (mounted) setStxAddress(stxAddr);

        // Always load BTC address
        const btcAddr = await getBitcoinAddressForAccount(
          account.index,
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
