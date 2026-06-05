import { useQuery } from "@tanstack/react-query";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinAddressForAccount } from "@/lib/bitcoin/addresses";
import { getAddressForNetwork } from "@/lib/stacks/addresses";
import { walletKit } from "@/lib/stacks/wallet";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";

type UseWalletAddressesOptions = {
  accountIndex?: number;
};

export function useWalletAddresses(options: UseWalletAddressesOptions = {}) {
  const { accountIndex: requestedAccountIndex } = options;
  const { selectedNetwork } = useSelectedNetwork();
  const { activeAccountIndex } = useActiveAccountIndex();
  const accountIndex = requestedAccountIndex ?? activeAccountIndex;
  const addressesQuery = useQuery({
    queryKey: ["wallet-addresses", selectedNetwork, accountIndex],
    queryFn: async () => {
      try {
        const accounts = await walletKit.getWalletAccounts();
        const account =
          accounts.find((entry) => entry.index === accountIndex) ?? null;

        if (!account) {
          return {
            stxAddress: null,
            btcAddress: null,
          };
        }

        const stxAddress = getAddressForNetwork(account, selectedNetwork);
        const btcAddress = await getBitcoinAddressForAccount(
          account.index,
          selectedNetwork,
        );

        return {
          stxAddress,
          btcAddress,
        };
      } catch (error) {
        console.error("Failed to load wallet addresses", error);
        return {
          stxAddress: null,
          btcAddress: null,
        };
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    stxAddress: addressesQuery.data?.stxAddress ?? null,
    btcAddress: addressesQuery.data?.btcAddress ?? null,
    walletKit,
    network: selectedNetwork as NetworkType,
    isLoading: addressesQuery.isLoading,
  };
}
