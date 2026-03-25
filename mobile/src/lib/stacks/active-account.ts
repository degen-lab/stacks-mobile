import { walletKit } from "@/lib/stacks/wallet";
import { getAddressForNetwork } from "./addresses";
import { useSettingsStore } from "@/lib/store/settings";

export async function getActiveWalletAccount() {
  const { activeAccountIndex, network } = useSettingsStore.getState();
  const accounts = await walletKit.getWalletAccounts();
  const account =
    accounts.find((account) => account.index === activeAccountIndex) ?? null;

  if (!account) {
    throw new Error("Wallet account not available.");
  }

  return {
    account,
    accountIndex: account.index,
    address: getAddressForNetwork(account, network),
    network,
  };
}
