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
  setNetwork: (network: NetworkType) => Promise<void>;
  setSecurityMethod: (method: "none" | "biometrics") => Promise<void>;
  hydrate: () => Promise<void>;
  hasHydrated: boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  network: resolveDefaultNetwork(),
  securityMethod: "none",
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
  hydrate: async () => {
    if (get().hasHydrated) return;
    try {
      const [storedNetwork, storedSecurity] = await Promise.all([
        getString(SELECTED_NETWORK_KEY),
        getString("settings.securityMethod"),
      ]);
      const nextNetwork = isNetwork(storedNetwork)
        ? storedNetwork
        : resolveDefaultNetwork();
      set({
        network: nextNetwork,
        securityMethod: storedSecurity === "biometrics" ? "biometrics" : "none",
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
