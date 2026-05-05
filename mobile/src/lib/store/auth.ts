import type {
  AuthProvider,
  AuthenticatedUser,
} from "@degenlab/stacks-wallet-kit-core";
import { create } from "zustand";

import type { UserData as BackendUserData } from "@/api/auth";
import { queryClient } from "@/api/common/api-provider";
import { resetConsentStore } from "@/lib/store/consent";
import { resetSettingsForSignedOutUser } from "@/lib/store/settings";
import { getItem, removeItem, setItem } from "@/lib/storage/storage";
import { walletKit } from "@/lib/stacks/wallet";

const ACCESS_TOKEN_KEY = "auth.accessToken";
const USER_DATA_KEY = "auth.userData";
const BACKEND_TOKEN_KEY = "auth.backendToken";
const BACKEND_USER_KEY = "auth.backendUser";
const REFERRAL_USED_KEY = "auth.referralUsed";
const HAS_BACKUP_KEY = "auth.hasBackup";
const AUTH_METHOD_KEY = "auth.method";

export type AuthMethod = "none" | AuthProvider;

type StoredAuthUser = {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  givenName: string | null;
};

export type SignInResult = {
  hasBackup: boolean;
  userData: StoredAuthUser | null;
};

type ClearLocalAccountDataOptions = {
  throwOnFailure?: boolean;
};

const SIGNED_OUT_STATE = {
  authMethod: "none" as const,
  accessToken: null,
  backendToken: null,
  isAuthenticated: false,
  isAuthenticating: false,
  hasHydrated: true,
  hasBackup: false,
  userData: null,
  backendUserData: null,
  referralUsed: false,
};

interface AuthState {
  authMethod: AuthMethod;
  accessToken: string | null;
  backendToken: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  hasHydrated: boolean;

  hasBackup: boolean;
  userData: StoredAuthUser | null;
  backendUserData: BackendUserData | null;
  referralUsed: boolean;

  setHasBackup: (hasBackup: boolean) => void;
  signInWithGoogle: () => Promise<SignInResult>;
  signInWithApple: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;

  completeAuth: (hasBackup: boolean) => void;
  setBackendSession: (
    token: string | null,
    userData: BackendUserData | null,
    referralUsed: boolean,
  ) => Promise<void>;
  setBackendUserData: (userData: BackendUserData | null) => Promise<void>;
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

  setHasBackup: (hasBackup: boolean) => {
    set({ hasBackup });
    void setItem(HAS_BACKUP_KEY, hasBackup).catch((error) => {
      console.error("Failed to persist backup status:", error);
    });
  },

  signInWithGoogle: () => signInWithProvider("google", set),

  signInWithApple: () => signInWithProvider("apple", set),

  signOut: async () => {
    await clearLocalAccountData();
  },

  hydrate: async () => {
    try {
      // Check if user has a persisted accessToken (Google authentication)
      const [
        persistedMethod,
        persistedToken,
        persistedUser,
        persistedBackendToken,
        persistedBackendUser,
        persistedReferralUsed,
        persistedHasBackup,
      ] = await Promise.all([
        getItem<AuthMethod>(AUTH_METHOD_KEY),
        getItem<string>(ACCESS_TOKEN_KEY),
        getItem<unknown>(USER_DATA_KEY),
        getItem<string>(BACKEND_TOKEN_KEY),
        getItem<BackendUserData>(BACKEND_USER_KEY),
        getItem<boolean>(REFERRAL_USED_KEY),
        getItem<boolean>(HAS_BACKUP_KEY),
      ]);

      const storedUser = normalizeStoredAuthUser(persistedUser);

      if (storedUser) {
        const authMethod =
          persistedMethod === "apple" || persistedMethod === "google"
            ? persistedMethod
            : "google";
        const accounts = await walletKit.getWalletAccounts().catch(() => null);
        const hasAccounts = accounts ? accounts.length > 0 : !!storedUser;

        set({
          accessToken: persistedToken ?? null,
          isAuthenticated: hasAccounts,
          authMethod: hasAccounts ? authMethod : "none",
          hasHydrated: true,
          hasBackup: persistedHasBackup ?? false,
          userData: storedUser,
          backendToken: persistedBackendToken ?? null,
          backendUserData: persistedBackendUser ?? null,
          referralUsed: persistedReferralUsed ?? false,
        });
      } else {
        await Promise.all([
          removeItem(AUTH_METHOD_KEY),
          removeItem(BACKEND_TOKEN_KEY),
          removeItem(BACKEND_USER_KEY),
          removeItem(REFERRAL_USED_KEY),
          removeItem(HAS_BACKUP_KEY),
        ]);

        // No persisted user, user is not authenticated
        set({
          accessToken: null,
          backendToken: null,
          isAuthenticated: false,
          authMethod: "none",
          hasHydrated: true,
          userData: null,
          backendUserData: null,
          referralUsed: false,
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

  completeAuth: (hasBackup: boolean) => {
    const authMethod =
      get().authMethod === "none" ? "google" : get().authMethod;
    void Promise.all([
      setItem(HAS_BACKUP_KEY, hasBackup),
      setItem(AUTH_METHOD_KEY, authMethod),
    ]).catch((error) => {
      console.error("Failed to persist auth completion:", error);
    });
    set({
      hasBackup,
      isAuthenticated: true,
      authMethod,
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

  setBackendUserData: async (userData: BackendUserData | null) => {
    try {
      if (userData) {
        await setItem(BACKEND_USER_KEY, userData);
      } else {
        await removeItem(BACKEND_USER_KEY);
      }

      set({
        backendUserData: userData,
      });
    } catch (error) {
      console.error("Failed to persist backend user:", error);
      throw error;
    }
  },
}));

async function signInWithProvider(
  provider: AuthProvider,
  set: (partial: Partial<AuthState>) => void,
): Promise<SignInResult> {
  set({ isAuthenticating: true });
  try {
    const { user } = await walletKit.signIn(provider);
    const hasBackup = await walletKit.hasBackup(provider);
    const userData = toStoredUser(user);
    const accessToken =
      user.provider === "google" ? user.credentials.accessToken : null;
    if (accessToken) {
      await setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      await removeItem(ACCESS_TOKEN_KEY);
    }
    await Promise.all([
      setItem(AUTH_METHOD_KEY, provider),
      setItem(USER_DATA_KEY, userData),
      setItem(HAS_BACKUP_KEY, hasBackup),
    ]);
    set({
      accessToken,
      isAuthenticated: false,
      authMethod: provider,
      hasHydrated: true,
      hasBackup,
      userData,
    });
    return { hasBackup, userData };
  } catch (error) {
    console.error("Sign in failed:", error);
    throw error;
  } finally {
    set({ isAuthenticating: false });
  }
}

function getNameParts(displayName: string | null, email: string | null) {
  const [givenName = null] = displayName?.split(" ").filter(Boolean) ?? [];

  return {
    givenName,
    name: displayName || email?.split("@")[0] || "Stacks user",
  };
}

function toStoredUser(user: AuthenticatedUser): StoredAuthUser {
  const nameParts = getNameParts(user.displayName, user.email);

  if (user.provider === "apple") {
    return {
      id: `apple:${user.providerUserId}`,
      email: user.email ?? "",
      name: nameParts.name,
      photo: user.photoUri,
      givenName: user.appleProfile.fullName.givenName ?? nameParts.givenName,
    };
  }

  return {
    id: user.providerUserId,
    email: user.email ?? "",
    name: nameParts.name,
    photo: user.photoUri,
    givenName: nameParts.givenName,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStoredAuthUser(value: unknown): StoredAuthUser | null {
  const candidate =
    isRecord(value) && isRecord(value.user) ? value.user : value;

  if (!isRecord(candidate) || typeof candidate.id !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    email: typeof candidate.email === "string" ? candidate.email : "",
    name: typeof candidate.name === "string" ? candidate.name : "Stacks user",
    photo: typeof candidate.photo === "string" ? candidate.photo : null,
    givenName:
      typeof candidate.givenName === "string" ? candidate.givenName : null,
  };
}

export function useAuth(): AuthState {
  return useAuthStore();
}

export async function clearLocalAccountData(
  options: ClearLocalAccountDataOptions = {},
): Promise<void> {
  useAuthStore.setState(SIGNED_OUT_STATE);
  queryClient.clear();

  const cleanupSettlements = await Promise.allSettled([
    walletKit.signOut(),
    removeItem(AUTH_METHOD_KEY),
    removeItem(ACCESS_TOKEN_KEY),
    removeItem(USER_DATA_KEY),
    removeItem(BACKEND_TOKEN_KEY),
    removeItem(BACKEND_USER_KEY),
    removeItem(REFERRAL_USED_KEY),
    removeItem(HAS_BACKUP_KEY),
    resetConsentStore(),
    resetSettingsForSignedOutUser(),
  ]);

  const failedCleanup = cleanupSettlements.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (failedCleanup) {
    console.error("Failed to clear local account data:", failedCleanup.reason);

    if (options.throwOnFailure) {
      throw new Error("Failed to clear local account data.");
    }
  }
}

export const signOut = () => useAuthStore.getState().signOut();
export const signIn = () => useAuthStore.getState().signInWithGoogle();
export const getBackendToken = () => useAuthStore.getState().backendToken;
export const hydrateAuth = async () => {
  await useAuthStore.getState().hydrate();
  return useAuthStore.getState().backendUserData;
};
