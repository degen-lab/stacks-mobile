import type { ReactNode } from "react";

import { fireEvent, render, screen, waitFor } from "@/lib/tests";

import { TransferSheet } from "../container/TransferSheet";

const mockPresent = jest.fn();
const mockDismiss = jest.fn();
const mockSetMode = jest.fn();
const mockInitialize = jest.fn();
const mockReset = jest.fn();
const mockMutateAsync = jest.fn();
const mockShowMessage = jest.fn();
const mockUseSendFlow = jest.fn();
const mockUsePrepareBtcSend = jest.fn();
const mockSubmitBuiltWalletTransaction = jest.fn();
const mockSubmitBuiltSponsoredTransaction = jest.fn();

jest.mock("@/hooks/use-sponsored-stacks-transaction", () => ({
  useSponsoredStacksTransaction: () => ({
    submitSponsoredTransaction: mockSubmitBuiltSponsoredTransaction,
    isSubmittingSponsored: false,
  }),
}));

jest.mock("@/lib/stacks/active-account", () => ({
  getActiveWalletAccount: async () => ({
    account: { publicKey: "abc123" },
    accountIndex: 0,
    address: "STX123",
    network: "testnet",
  }),
}));

jest.mock("@/hooks/use-sign-transaction", () => ({
  useSignTransaction: () => mockSubmitBuiltWalletTransaction,
}));

jest.mock("@stacks/transactions", () => ({
  broadcastTransaction: jest.fn().mockResolvedValue({ txid: "stx-txid-abc" }),
  deserializeTransaction: jest.fn().mockReturnValue({}),
}));

jest.mock("../hooks/use-prepare-stx-send", () => ({
  usePrepareStxSend: () => ({
    data: { feeMicroStx: 1500, feeDisplay: "0.001500" },
    isLoading: false,
    error: null,
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("react-native-flash-message", () => ({
  showMessage: (...args: unknown[]) => mockShowMessage(...args),
}));

jest.mock("@/components/ui", () => ({
  Modal: ({ children, title }: { children: ReactNode; title?: string }) => {
    const { Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return (
      <View>
        {title ? <Text>{title}</Text> : null}
        {children}
      </View>
    );
  },
  Text: ({ children }: { children: ReactNode }) => {
    const { Text } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return <Text>{children}</Text>;
  },
}));

jest.mock("@/components/ui/modal", () => ({
  useModal: () => ({
    ref: { current: null },
    present: mockPresent,
    dismiss: mockDismiss,
  }),
}));

jest.mock("@/api/bitcoin", () => ({
  useBroadcastBitcoinTransaction: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

jest.mock("@/lib/store/settings", () => ({
  useSelectedNetwork: () => ({ selectedNetwork: "testnet" }),
}));

jest.mock("../hooks/use-transfer", () => ({
  useTransfer: () => ({
    mode: "send",
    setMode: mockSetMode,
    stxAddress: "STX123",
    btcAddress: "tb1qsender0000000000000000000000000000000",
    getCurrentBalance: () => 0.25,
    getCurrentBalanceIsLoading: () => false,
  }),
}));

jest.mock("../hooks/use-send-flow", () => ({
  useSendFlow: (...args: unknown[]) => mockUseSendFlow(...args),
}));

jest.mock("../hooks/use-prepare-btc-send", () => ({
  usePrepareBtcSend: (...args: unknown[]) => mockUsePrepareBtcSend(...args),
}));

jest.mock("../components/send/confirmation", () => ({
  Confirmation: ({
    onConfirm,
    fee,
    feeAsset,
    info,
    feeRatePerVbyte,
  }: {
    onConfirm: () => void;
    fee: string;
    feeAsset: string;
    info?: string | null;
    feeRatePerVbyte?: number;
  }) => {
    const { Pressable, Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return (
      <View>
        <Text>{fee}</Text>
        <Text>{feeAsset}</Text>
        {info ? <Text>{info}</Text> : null}
        {feeRatePerVbyte != null ? <Text>{feeRatePerVbyte} sat/vB</Text> : null}
        <Pressable onPress={onConfirm}>
          <Text>Confirm transfer</Text>
        </Pressable>
      </View>
    );
  },
}));

const defaultSendFlow = {
  currentStep: "confirm" as const,
  formData: {
    asset: "BTC" as const,
    amount: "0.001",
    recipient: "tb1qrecipient0000000000000000000000000000",
    memo: "",
    source: "manual" as const,
  },
  locks: { asset: false, amount: false, recipient: false, memo: false },
  initialize: mockInitialize,
  reset: mockReset,
  previousStep: jest.fn(),
  nextStep: jest.fn(),
  updateAsset: jest.fn(),
  updateAmount: jest.fn(),
  updateRecipient: jest.fn(),
  updateMemo: jest.fn(),
};

const defaultPreparedBtcSend = {
  data: {
    txId: "a".repeat(64),
    rawTxHex: "020000000001",
    feeSats: 321,
    feeRate: 12,
    inputSats: 200_000,
    amountSats: 100_000,
    changeSats: 99_679,
    recipient: "tb1qrecipient0000000000000000000000000000",
    senderAddress: "tb1qsender0000000000000000000000000000000",
  },
  isLoading: false,
  error: null,
};

describe("TransferSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue("b".repeat(64));
    mockUseSendFlow.mockReturnValue(defaultSendFlow);
    mockUsePrepareBtcSend.mockReturnValue(defaultPreparedBtcSend);
  });

  it("broadcasts the prepared BTC transaction from the confirmation step", async () => {
    const onClose = jest.fn();

    render(
      <TransferSheet
        open
        onClose={onClose}
        request={{
          mode: "send",
          send: {
            asset: "BTC",
            amount: "0.001",
            recipient: "tb1qrecipient0000000000000000000000000000",
          },
        }}
        requestVersion={1}
      />,
    );

    expect(screen.getByText("Send BTC")).toBeTruthy();
    expect(screen.getByText("0.00000321")).toBeTruthy();
    expect(screen.getByText("BTC")).toBeTruthy();
    expect(screen.getByText("12 sat/vB")).toBeTruthy();

    fireEvent.press(screen.getByText("Confirm transfer"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith("020000000001");
    });

    await waitFor(() => {
      expect(mockShowMessage).toHaveBeenCalledWith({
        message: "Bitcoin transaction submitted",
        description: "b".repeat(64),
        type: "success",
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPresent).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledWith({
      asset: "BTC",
      amount: "0.001",
      recipient: "tb1qrecipient0000000000000000000000000000",
    });
  });

  it("shows an error message when broadcast fails", async () => {
    mockMutateAsync.mockRejectedValue(new Error("Network error"));
    const onClose = jest.fn();

    render(<TransferSheet open onClose={onClose} requestVersion={1} />);

    fireEvent.press(screen.getByText("Confirm transfer"));

    await waitFor(() => {
      expect(mockShowMessage).toHaveBeenCalledWith({
        message: "Bitcoin transaction failed",
        description: "Network error",
        type: "danger",
      });
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows a warning when trying to send a non-BTC, non-STX asset", async () => {
    mockUseSendFlow.mockReturnValue({
      ...defaultSendFlow,
      formData: { ...defaultSendFlow.formData, asset: "sBTC" as const },
    });

    render(<TransferSheet open onClose={jest.fn()} requestVersion={1} />);

    fireEvent.press(screen.getByText("Confirm transfer"));

    await waitFor(() => {
      expect(mockShowMessage).toHaveBeenCalledWith({
        message: "sBTC transfers are not available yet",
        type: "warning",
      });
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("shows an error when transaction could not be prepared", async () => {
    mockUsePrepareBtcSend.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Mempool unavailable"),
    });

    render(<TransferSheet open onClose={jest.fn()} requestVersion={1} />);

    fireEvent.press(screen.getByText("Confirm transfer"));

    await waitFor(() => {
      expect(mockShowMessage).toHaveBeenCalledWith({
        message: "Unable to prepare the Bitcoin transaction",
        description: "Mempool unavailable",
        type: "danger",
      });
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
