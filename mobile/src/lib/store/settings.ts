import { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { create } from "zustand";

import { Env } from "@/lib/env";
import { getString, setString } from "@/lib/storage/storage";
import { walletKit } from "@/lib/wallet";

const SELECTED_NETWORK_KEY = "settings.network";

const isNetwork = (value?: string | null): value is NetworkType => {
  return value === "mainnet" || value === "testnet" || value === "devnet";
};

const resolveDefaultNetwork = (): NetworkType => {
  if (isNetwork(Env.NETWORK)) return Env.NETWORK;
  return NetworkType.Testnet;
};

interface SettingsState {
  network: NetworkType;
  securityMethod: "none" | "biometrics";
  activeAccountIndex: number;
  setNetwork: (network: NetworkType) => Promise<void>;
  setSecurityMethod: (method: "none" | "biometrics") => Promise<void>;
  setActiveAccountIndex: (index: number) => Promise<void>;
  hydrate: () => Promise<void>;
  hasHydrated: boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  network: resolveDefaultNetwork(),
  securityMethod: "none",
  activeAccountIndex: 0,
  hasHydrated: false,
  setNetwork: async (network) => {
    if (get().network === network) return;
    set({ network });
    walletKit.setNetwork(network);
    try {
      await setString(SELECTED_NETWORK_KEY, network);
    } catch (error) {
      console.error("Failed to save network setting:", error);
    }
  },
  setSecurityMethod: async (method) => {
    set({ securityMethod: method });
    try {
      await setString("settings.securityMethod", method);
    } catch (error) {
      console.error("Failed to save security method:", error);
    }
  },
  setActiveAccountIndex: async (index) => {
    set({ activeAccountIndex: index });
    try {
      await setString("settings.activeAccountIndex", String(index));
    } catch (error) {
      console.error("Failed to save active account index:", error);
    }
  },
  hydrate: async () => {
    if (get().hasHydrated) return;
    try {
      const [storedNetwork, storedSecurity, storedActiveAccount] =
        await Promise.all([
          getString(SELECTED_NETWORK_KEY),
          getString("settings.securityMethod"),
          getString("settings.activeAccountIndex"),
        ]);
      const nextNetwork = isNetwork(storedNetwork)
        ? storedNetwork
        : resolveDefaultNetwork();
      const activeAccountIndex = storedActiveAccount
        ? parseInt(storedActiveAccount, 10)
        : 0;
      set({
        network: nextNetwork,
        securityMethod: storedSecurity === "biometrics" ? "biometrics" : "none",
        activeAccountIndex: isNaN(activeAccountIndex) ? 0 : activeAccountIndex,
        hasHydrated: true,
      });
      walletKit.setNetwork(nextNetwork);
    } catch (error) {
      console.error("Failed to hydrate settings:", error);
      set({ hasHydrated: true });
    }
  },
}));

export const loadSettings = async () => {
  await useSettingsStore.getState().hydrate();
};

export const useSelectedNetwork = () => {
  const selectedNetwork = useSettingsStore((state) => state.network);
  const setSelectedNetwork = useSettingsStore((state) => state.setNetwork);
  return { selectedNetwork, setSelectedNetwork } as const;
};

export const useSecurityMethod = () => {
  const securityMethod = useSettingsStore((state) => state.securityMethod);
  const setSecurityMethod = useSettingsStore(
    (state) => state.setSecurityMethod,
  );
  return { securityMethod, setSecurityMethod } as const;
};

export const useActiveAccountIndex = () => {
  const activeAccountIndex = useSettingsStore(
    (state) => state.activeAccountIndex,
  );
  const setActiveAccountIndex = useSettingsStore(
    (state) => state.setActiveAccountIndex,
  );
  return { activeAccountIndex, setActiveAccountIndex } as const;
};
