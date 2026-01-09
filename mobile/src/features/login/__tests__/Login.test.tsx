import { fireEvent, render, waitFor } from "@/lib/tests";
import type { SignInResult } from "@/lib/store/auth";
import { __mockRouter } from "expo-router";

import LoginScreen from "../container/Login";

const mockAuthState = {
  isAuthenticating: false,
  referralUsed: false,
};

const mockSignInWithGoogle = jest.fn();
const mockSetBackendSession = jest.fn();
const mockMutateAsync = jest.fn();
const mockFetchQuery = jest.fn();
const mockShowError = jest.fn();
const mockShowErrorMessage = jest.fn();
const authMutationState = { isPending: false };

const mockReferralModal = {
  ref: { current: null },
  present: jest.fn(),
  dismiss: jest.fn(),
  dismissWithCallback: (cb: () => void) => cb(),
  onDismiss: jest.fn(),
};

const mockLatestModalProps: { current: Record<string, any> | null } = {
  current: null,
};

const authState = mockAuthState;
const signInWithGoogle = mockSignInWithGoogle;
const setBackendSession = mockSetBackendSession;
const mutateAsync = mockMutateAsync;
const fetchQuery = mockFetchQuery;
const showError = mockShowError;
const showErrorMessage = mockShowErrorMessage;
const referralModal = mockReferralModal;
const latestModalProps = mockLatestModalProps;

jest.mock("@/api", () => ({
  queryClient: {
    fetchQuery: (...args: unknown[]) => mockFetchQuery(...args),
  },
}));

jest.mock("@/api/auth/use-user-auth", () => ({
  useAuthMutation: () => ({
    mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    isPending: authMutationState.isPending,
  }),
}));

jest.mock("@/api/user", () => ({
  useIsNewUser: {
    getFetchOptions: (params: unknown) => params,
  },
}));

jest.mock("@/components/ui/utils", () => ({
  showError: (...args: unknown[]) => mockShowError(...args),
  showErrorMessage: (...args: unknown[]) => mockShowErrorMessage(...args),
}));

jest.mock("@/features/login/components/referral-modal", () => ({
  ReferralCodeModal: (props: Record<string, any>) => {
    mockLatestModalProps.current = props;
    return null;
  },
  useReferralCodeModal: () => mockReferralModal,
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => ({
    signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
    isAuthenticating: mockAuthState.isAuthenticating,
    setBackendSession: (...args: unknown[]) => mockSetBackendSession(...args),
    referralUsed: mockAuthState.referralUsed,
  }),
}));

const createGoogleResult = (hasBackup = false): SignInResult => {
  const userData: NonNullable<SignInResult["userData"]> = {
    idToken: "id-token",
    serverAuthCode: "server-auth-code",
    scopes: [],
    user: {
      id: "user-1",
      name: "Test User",
      givenName: "Test",
      photo: "https://example.com/photo.png",
      email: "",
      familyName: null,
    },
  };

  return { userData, hasBackup };
};

const createInvalidGoogleResult = (): SignInResult => ({
  userData: null,
  hasBackup: false,
});

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
    latestModalProps.current = null;
    referralModal.present.mockClear();
    referralModal.dismiss.mockClear();
    referralModal.onDismiss.mockClear();
    authState.isAuthenticating = false;
    authState.referralUsed = false;
    authMutationState.isPending = false;
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("routes existing users without backup to /wallet-new", async () => {
    signInWithGoogle.mockResolvedValue(createGoogleResult(false));
    fetchQuery.mockResolvedValue({ isNewUser: false });
    mutateAsync.mockResolvedValue({
      token: "token",
      data: { id: "backend-user" },
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: "user-1",
          nickName: "Test User",
          photoUri: "https://example.com/photo.png",
        }),
      );
      expect(setBackendSession).toHaveBeenCalledTimes(1);

      expect(__mockRouter.replace).toHaveBeenCalledWith("/wallet-new");
    });
  });

  it("routes existing users with backup to /wallet-restore", async () => {
    signInWithGoogle.mockResolvedValue(createGoogleResult(true));
    fetchQuery.mockResolvedValue({ isNewUser: false });
    mutateAsync.mockResolvedValue({
      token: "token",
      data: { id: "backend-user" },
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
      expect(__mockRouter.replace).toHaveBeenCalledWith("/wallet-restore");
    });
  });

  it("blocks sign in when already authenticating", async () => {
    authState.isAuthenticating = true;

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(signInWithGoogle).not.toHaveBeenCalled();
    });
  });

  it("blocks sign in when auth mutation is pending", async () => {
    authMutationState.isPending = true;

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(signInWithGoogle).not.toHaveBeenCalled();
    });
  });

  it("opens referral modal for new users", async () => {
    signInWithGoogle.mockResolvedValue(createGoogleResult());
    fetchQuery.mockResolvedValue({ isNewUser: true });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalledTimes(1);
      expect(referralModal.present).toHaveBeenCalledTimes(1);
    });
  });

  it("confirms referral and routes to /wallet-restore when backup exists", async () => {
    signInWithGoogle.mockResolvedValue(createGoogleResult(true));
    fetchQuery.mockResolvedValue({ isNewUser: true });
    mutateAsync.mockResolvedValue({
      token: "token",
      data: { id: "backend-user" },
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(referralModal.present).toHaveBeenCalledTimes(1);
      expect(latestModalProps.current).toBeTruthy();
    });

    await latestModalProps.current?.onConfirm("REF123");

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: "user-1",
          nickName: "Test User",
          photoUri: "https://example.com/photo.png",
          referralCode: "REF123",
        }),
      );

      expect(__mockRouter.replace).toHaveBeenCalledWith("/wallet-restore");
    });
  });

  it("skips referral modal when referral was already used", async () => {
    authState.referralUsed = true;
    signInWithGoogle.mockResolvedValue(createGoogleResult(false));
    mutateAsync.mockResolvedValue({
      token: "token",
      data: { id: "backend-user" },
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(fetchQuery).not.toHaveBeenCalled();
      expect(referralModal.present).not.toHaveBeenCalled();
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  it("continues sign in when referral modal is dismissed", async () => {
    signInWithGoogle.mockResolvedValue(createGoogleResult(false));
    fetchQuery.mockResolvedValue({ isNewUser: true });
    mutateAsync.mockResolvedValue({
      token: "token",
      data: { id: "backend-user" },
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(referralModal.present).toHaveBeenCalledTimes(1);
    });

    await latestModalProps.current?.onDismiss();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
      expect(__mockRouter.replace).toHaveBeenCalledWith("/wallet-new");
    });
  });

  it("continues sign in when new user check fails", async () => {
    signInWithGoogle.mockResolvedValue(createGoogleResult(false));
    fetchQuery.mockRejectedValue(new Error("network down")); // Failure
    mutateAsync.mockResolvedValue({
      token: "token",
      data: { id: "backend-user" },
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      // Should still try to login
      expect(mutateAsync).toHaveBeenCalledTimes(1);
      expect(__mockRouter.replace).toHaveBeenCalledWith("/wallet-new");
    });
  });
  it("shows error when google user info is missing", async () => {
    signInWithGoogle.mockResolvedValue(createInvalidGoogleResult());

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(showErrorMessage).toHaveBeenCalledWith(
        "Google user info missing. Please try again.",
      );
    });
  });

  it("shows error when google sign-in fails", async () => {
    signInWithGoogle.mockRejectedValue(new Error("google down"));

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(showErrorMessage).toHaveBeenCalledWith(
        "Google sign in failed. Please try again.",
      );
    });
  });

  it("shows axios error when auth fails", async () => {
    signInWithGoogle.mockResolvedValue(createGoogleResult(false));
    fetchQuery.mockResolvedValue({ isNewUser: false });

    mutateAsync.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500 },
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledTimes(1);
    });
  });

  it("shows generic error when auth fails without axios", async () => {
    signInWithGoogle.mockResolvedValue(createGoogleResult(false));
    fetchQuery.mockResolvedValue({ isNewUser: false });
    mutateAsync.mockRejectedValue(new Error("unknown boom"));

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId("google-signin-button"));

    await waitFor(() => {
      expect(showErrorMessage).toHaveBeenCalledWith(
        "Failed to complete sign in. Please try again.",
      );
    });
  });
});
