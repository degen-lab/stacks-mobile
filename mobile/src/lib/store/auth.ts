import type { User } from "@degenlab/stacks-wallet-kit-core";
import { create } from "zustand";

import type { UserData as BackendUserData } from "@/api/auth";
import { getItem, removeItem, setItem } from "@/lib/storage/storage";
import { walletKit } from "@/lib/wallet";

const ACCESS_TOKEN_KEY = "auth.accessToken";
const USER_DATA_KEY = "auth.userData";
const BACKEND_TOKEN_KEY = "auth.backendToken";
const BACKEND_USER_KEY = "auth.backendUser";
const REFERRAL_USED_KEY = "auth.referralUsed";

export type AuthMethod = "none" | "google";

export type SignInResult = {
  hasBackup: boolean;
  userData: User | null;
};

interface AuthState {
  authMethod: AuthMethod;
  accessToken: string | null;
  backendToken: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  hasHydrated: boolean;

  hasBackup: boolean;
  userData: User | null;
  backendUserData: BackendUserData | null;
  referralUsed: boolean;

  setHasBackup: (hasBackup: boolean) => void;
  signInWithGoogle: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;

  completeGoogleAuth: (hasBackup: boolean) => void;
  setBackendSession: (
    token: string | null,
    userData: BackendUserData | null,
    referralUsed: boolean,
  ) => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  authMethod: "none",
  accessToken: null,
  backendToken: null,
  isAuthenticated: false,
  isAuthenticating: false,
  hasHydrated: false,
  hasBackup: false,
  userData: null,
  backendUserData: null,
  referralUsed: false,

  setHasBackup: (hasBackup: boolean) => set({ hasBackup }),

  signInWithGoogle: async () => {
    set({ isAuthenticating: true });
    try {
      const { accessToken, hasBackup, userData } =
        await walletKit.loginWithGoogle();
      if (accessToken) {
        await setItem(ACCESS_TOKEN_KEY, accessToken);
      }
      if (userData) {
        await setItem(USER_DATA_KEY, userData);
      } else {
        await removeItem(USER_DATA_KEY);
      }
      set({
        accessToken,
        isAuthenticated: false,
        authMethod: "google",
        hasHydrated: true,
        hasBackup,
        userData: userData ?? null,
      });
      return { hasBackup, userData: userData ?? null };
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    } finally {
      set({ isAuthenticating: false });
    }
  },

  signOut: async () => {
    try {
      await walletKit.signOut();
      await removeItem(ACCESS_TOKEN_KEY);
      await removeItem(USER_DATA_KEY);
      await removeItem(BACKEND_TOKEN_KEY);
      await removeItem(BACKEND_USER_KEY);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
    set({
      authMethod: "none",
      accessToken: null,
      backendToken: null,
      isAuthenticated: false,
      hasHydrated: true,
      hasBackup: false,
      userData: null,
      backendUserData: null,
      referralUsed: false,
    });
  },

  hydrate: async () => {
    try {
      // Check if user has a persisted accessToken (Google authentication)
      const [
        persistedToken,
        persistedUser,
        persistedBackendToken,
        persistedBackendUser,
        persistedReferralUsed,
      ] = await Promise.all([
        getItem<string>(ACCESS_TOKEN_KEY),
        getItem<User>(USER_DATA_KEY),
        getItem<string>(BACKEND_TOKEN_KEY),
        getItem<BackendUserData>(BACKEND_USER_KEY),
        getItem<boolean>(REFERRAL_USED_KEY),
      ]);

      if (persistedToken) {
        // User has authenticated with Google before
        // Verify they still have wallet accounts
        const accounts = await walletKit.getWalletAccounts();
        const hasAccounts = accounts && accounts.length > 0;

        set({
          accessToken: persistedToken,
          isAuthenticated: hasAccounts, // Only authenticated if they have accounts
          authMethod: hasAccounts ? "google" : "none",
          hasHydrated: true,
          userData: persistedUser ?? null,
          backendToken: persistedBackendToken ?? null,
          backendUserData: persistedBackendUser ?? null,
          referralUsed: persistedReferralUsed ?? false,
        });
      } else {
        // No persisted token, user is not authenticated
        set({
          accessToken: null,
          backendToken: persistedBackendToken ?? null,
          isAuthenticated: false,
          authMethod: "none",
          hasHydrated: true,
          userData: null,
          backendUserData: persistedBackendUser ?? null,
          referralUsed: persistedReferralUsed ?? false,
        });
      }
    } catch (error) {
      console.error("Failed to hydrate auth store:", error);
      set({
        authMethod: "none",
        accessToken: null,
        backendToken: null,
        isAuthenticated: false,
        hasHydrated: true,
        userData: null,
        backendUserData: null,
        referralUsed: false,
      });
    }
  },

  completeGoogleAuth: (hasBackup: boolean) => {
    set({
      hasBackup,
      isAuthenticated: true,
      authMethod: "google",
    });
  },

  setBackendSession: async (
    token: string | null,
    userData: BackendUserData | null,
    referralUsed: boolean,
  ) => {
    try {
      if (token) {
        await setItem(BACKEND_TOKEN_KEY, token);
      } else {
        await removeItem(BACKEND_TOKEN_KEY);
      }

      if (userData) {
        await setItem(BACKEND_USER_KEY, userData);
      } else {
        await removeItem(BACKEND_USER_KEY);
      }

      await setItem(REFERRAL_USED_KEY, referralUsed);

      set({
        backendToken: token,
        backendUserData: userData,
        referralUsed,
      });
    } catch (error) {
      console.error("Failed to persist backend session:", error);
      throw error;
    }
  },
}));

export function useAuth(): AuthState {
  return useAuthStore();
}

export const signOut = () => useAuthStore.getState().signOut();
export const signIn = () => useAuthStore.getState().signInWithGoogle();
export const getBackendToken = () => useAuthStore.getState().backendToken;
export const hydrateAuth = async () => {
  await useAuthStore.getState().hydrate();
};
