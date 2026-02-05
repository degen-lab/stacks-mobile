import {
  useCallback,
  useMemo,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal, Text, Button } from "@/components/ui";
import { useDebounce } from "@/hooks/use-debounce";
import {
  TransakQuoteError,
  useTransakQuote,
} from "@/api/transak/use-transak-quote";
import { useCreateTransakWidgetUrl } from "@/api/transak/use-transak-widget";
import {
  Events,
  type TransakConfig,
  type OnTransakEvent,
} from "@transak/ui-expo-sdk";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";
import { useStxBalance } from "@/hooks/use-stx-balance";
import {
  BottomSheetModal,
  BottomSheetFooter,
  BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { getAddressForNetwork } from "@/lib/stacks/addresses";
import { walletKit } from "@/lib/stacks/wallet";
import { getBitcoinAddressForAccount } from "@/lib/bitcoin/addresses";
import type { AssetOption, TransakDrawerRef } from "../types";
import { TransakDrawerLayout } from "./TransakDrawer.layout";

type Props = {
  drawerRef: React.RefObject<TransakDrawerRef | null>;
};

export type { TransakDrawerRef };

type QuoteLimit = {
  min?: number;
  max?: number;
  unit?: string;
  featureDisabled?: boolean;
  message?: string;
};

export function TransakDrawer({ drawerRef }: Props) {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  /** Ref set when drawer opens so we always use the requested action for the widget (avoids state timing) */
  const requestedActionRef = useRef<"buy" | "sell">("buy");
  const [asset, setAsset] = useState<AssetOption>("BTC");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "checkout">("form");
  const { selectedNetwork } = useSelectedNetwork();
  const { activeAccountIndex } = useActiveAccountIndex();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [quoteLimits, setQuoteLimits] = useState<Record<string, QuoteLimit>>(
    {},
  );
  const fiatCurrency = "USD";
  const isSell = action === "sell";

  const { availableBalance } = useStxBalance(activeAccountIndex);
  const snapPoints = useMemo(() => ["85%", "85%"], []);
  const isCheckout = step === "checkout";

  useEffect(() => {
    let mounted = true;
    const loadAddress = async () => {
      try {
        const accounts = await walletKit.getWalletAccounts();
        const account = accounts[activeAccountIndex];
        const address = account
          ? getAddressForNetwork(account, selectedNetwork)
          : null;
        if (mounted) setWalletAddress(address);

        // Load Bitcoin address
        const btcAddr = await getBitcoinAddressForAccount(
          activeAccountIndex,
          selectedNetwork,
        );
        if (mounted) setBtcAddress(btcAddr);
      } catch (e) {
        console.error("Failed to load wallet address", e);
        if (mounted) {
          setWalletAddress(null);
          setBtcAddress(null);
        }
      }
    };
    loadAddress();
    return () => {
      mounted = false;
    };
  }, [activeAccountIndex, selectedNetwork]);

  const debouncedAmount = useDebounce(amount, 500);
  const numericAmount = parseFloat(debouncedAmount);
  const amountValue = isNaN(numericAmount) ? 0 : numericAmount;
  const limitKey = `${isSell ? "SELL" : "BUY"}:${asset}:${fiatCurrency}`;
  const currentLimits = quoteLimits[limitKey];
  const limitUnit = currentLimits?.unit || (isSell ? asset : fiatCurrency);
  const isBelowMin =
    currentLimits?.min !== undefined &&
    amountValue > 0 &&
    amountValue < currentLimits.min;
  const isAboveMax =
    currentLimits?.max !== undefined &&
    amountValue > 0 &&
    amountValue > currentLimits.max;
  const isOutsideLimits = isBelowMin || isAboveMax;
  const isFeatureDisabled = currentLimits?.featureDisabled === true;

  const quoteMessage =
    isFeatureDisabled || currentLimits?.message
      ? currentLimits?.message
      : isBelowMin
        ? `Minimum ${isSell ? "sell" : "buy"} amount: ${currentLimits?.min} ${limitUnit}`
        : isAboveMax
          ? `Maximum ${isSell ? "sell" : "buy"} amount: ${currentLimits?.max} ${limitUnit}`
          : undefined;

  const {
    data: quote,
    isLoading: isLoadingQuote,
    error: quoteError,
  } = useTransakQuote({
    variables: {
      ...(isSell ? { cryptoAmount: amountValue } : { fiatAmount: amountValue }),
      cryptoCurrency: asset,
      isBuyOrSell: isSell ? "SELL" : "BUY",
    },
    enabled:
      !isNaN(numericAmount) &&
      amountValue > 0 &&
      !isOutsideLimits &&
      !isFeatureDisabled,
  });

  useEffect(() => {
    if (!(quoteError instanceof TransakQuoteError)) return;

    setQuoteLimits((prev) => {
      const existing = prev[limitKey] ?? {};

      if (quoteError.kind === "min") {
        return {
          ...prev,
          [limitKey]: {
            ...existing,
            ...(Number.isFinite(quoteError.minAmount)
              ? { min: quoteError.minAmount }
              : {}),
            unit: quoteError.unit ?? existing.unit,
            message: !Number.isFinite(quoteError.minAmount)
              ? quoteError.message
              : existing.message,
          },
        };
      }

      if (quoteError.kind === "max") {
        return {
          ...prev,
          [limitKey]: {
            ...existing,
            max: quoteError.maxAmount,
            unit: quoteError.unit ?? existing.unit,
          },
        };
      }

      if (quoteError.kind === "feature") {
        return {
          ...prev,
          [limitKey]: {
            ...existing,
            featureDisabled: true,
            message: quoteError.message,
          },
        };
      }

      return prev;
    });
  }, [quoteError, limitKey]);

  const { mutate: createWidgetUrl, isPending: isCreatingSession } =
    useCreateTransakWidgetUrl();

  const handlePresent = useCallback(
    (defaultAsset?: AssetOption, defaultAction: "buy" | "sell" = "buy") => {
      requestedActionRef.current = defaultAction;
      if (defaultAction === "sell") {
        // Sell does not support STX; force BTC so quote never runs with STX
        setAsset(defaultAsset && defaultAsset !== "STX" ? defaultAsset : "BTC");
      } else if (defaultAsset) {
        setAsset(defaultAsset);
      }
      setAction(defaultAction);
      setAmount("");
      setCheckoutUrl(null);
      setStep("form");
    },
    [],
  );

  useImperativeHandle(drawerRef, () => ({
    present: (defaultAsset?: AssetOption, action?: "buy" | "sell") => {
      handlePresent(defaultAsset, action ?? "buy");
      modalRef.current?.present();
    },
    dismiss: () => {
      modalRef.current?.dismiss();
    },
  }));

  const handleContinue = useCallback(() => {
    if (!amount) return;
    const isSellFlow = requestedActionRef.current === "sell";
    const payload = {
      fiatAmount: isSellFlow ? undefined : numericAmount,
      cryptoAmount: isSellFlow ? numericAmount : undefined,
      fiatCurrency,
      cryptoCurrencyCode: asset,
      productsAvailed: (isSellFlow ? "SELL" : "BUY") as "BUY" | "SELL",
      walletAddress: !isSellFlow
        ? asset === "STX"
          ? (walletAddress ?? undefined)
          : asset === "BTC"
            ? (btcAddress ?? undefined)
            : undefined
        : undefined,
    };
    createWidgetUrl(payload, {
      onSuccess: (url) => {
        setCheckoutUrl(url);
        setStep("checkout");
        requestAnimationFrame(() => {
          modalRef.current?.snapToIndex?.(1);
        });
      },
      onError: (e) => {
        console.error("Failed to create widget URL", e);
      },
    });
  }, [
    amount,
    numericAmount,
    asset,
    walletAddress,
    btcAddress,
    createWidgetUrl,
    fiatCurrency,
  ]);

  const isValidAmount = useMemo(() => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }, [amount]);

  const handleCheckoutClose = useCallback(() => {
    setStep("form");
    setCheckoutUrl(null);
    requestAnimationFrame(() => {
      modalRef.current?.snapToIndex?.(0);
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setStep("form");
    setCheckoutUrl(null);
  }, []);

  const onTransakEvent: OnTransakEvent = useCallback(
    (event, eventData) => {
      switch (event) {
        case Events.TRANSAK_ORDER_SUCCESSFUL:
          break;
        case Events.TRANSAK_ORDER_FAILED:
          break;
        case Events.TRANSAK_WALLET_REDIRECTION:
          // For SELL flow: user needs to transfer crypto to Transak's wallet
          // eventData contains: walletAddress, cryptoCurrency, cryptoAmount, network
          // TODO: Handle wallet redirection (navigate to send screen with pre-filled data)
          break;
        case Events.TRANSAK_WIDGET_CLOSE:
          handleCheckoutClose();
          break;
        default:
          break;
      }
    },
    [handleCheckoutClose],
  );

  const transakConfig: TransakConfig = checkoutUrl
    ? { widgetUrl: checkoutUrl }
    : ({} as TransakConfig);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View className="px-5 pb-4 pt-2">
          <Button
            label="Continue"
            variant="gamePrimary"
            size="lg"
            onPress={handleContinue}
            loading={isLoadingQuote || isCreatingSession}
            disabled={
              !isValidAmount ||
              isOutsideLimits ||
              isFeatureDisabled ||
              (!!quoteError && !isOutsideLimits && !isFeatureDisabled) ||
              isLoadingQuote ||
              isCreatingSession
            }
          />
          <Text className="text-center text-xs text-secondary mt-3 font-instrument-sans">
            Powered by Transak • Secure Payment
          </Text>
        </View>
      </BottomSheetFooter>
    ),
    [
      handleContinue,
      insets.bottom,
      isCreatingSession,
      isLoadingQuote,
      isValidAmount,
      quoteError,
      isOutsideLimits,
      isFeatureDisabled,
    ],
  );

  return (
    <Modal
      ref={modalRef}
      snapPoints={snapPoints}
      title={
        !isCheckout
          ? action === "buy"
            ? "Buy Crypto"
            : "Sell Crypto"
          : undefined
      }
      onDismiss={handleDismiss}
      footerComponent={!isCheckout ? renderFooter : undefined}
    >
      <TransakDrawerLayout
        isCheckout={isCheckout}
        checkoutUrl={checkoutUrl}
        transakConfig={transakConfig}
        onTransakEvent={onTransakEvent}
        asset={asset}
        amount={amount}
        action={action}
        onAssetSelect={setAsset}
        onAmountChange={setAmount}
        isLoadingQuote={isLoadingQuote}
        quoteAmount={
          isSell ? (quote?.fiatAmount ?? null) : (quote?.cryptoAmount ?? null)
        }
        quoteUnit={isSell ? fiatCurrency : asset}
        quoteError={!!quoteError && !isOutsideLimits && !isFeatureDisabled}
        quoteMessage={quoteMessage}
        isValidAmount={isValidAmount}
        availableBalance={availableBalance}
        bottomInset={insets.bottom}
      />
    </Modal>
  );
}
