import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { showMessage } from "react-native-flash-message";

import { useBridgeFeeRecommendation } from "@/api/sbtc-bridge/hooks";
import { useModal } from "@/components/ui/modal";
import { useBtcBalance } from "@/hooks/use-btc-balance";
import {
  formatBtcAmount,
  formatBtcInput,
  formatBtcMetric,
  formatUsdCompact,
  fromSatsToBtc,
} from "@/lib/format/currency";
import { validateBitcoinAddress } from "@/lib/bitcoin/validation";
import type { FeeRateTier } from "@/features/transfer/hooks/use-prepare-btc-send";

import {
  useBridgeBalances,
  useBridgeConfig,
  useBridgeCurrentCap,
  useBridgeHistoryData,
  useBridgeOverviewMetrics,
} from "../../hooks/use-bridge-data";
import {
  usePrepareBridgeDeposit,
  useSubmitDeposit,
} from "../../hooks/use-deposit-flow";
import {
  useSubmitWithdrawal,
  useWithdrawalMaxFee,
} from "../../hooks/use-withdrawal-flow";
import { useBridgeTerms } from "../../hooks/use-bridge-terms";
import { BridgeHomeLayout } from "./BridgeHome.layout";
import type { StatItem } from "../../components/bridge-overview-grid";

function getDepositAmountError({
  amount,
  min,
  cap,
  balance,
}: {
  amount: string;
  min: number;
  cap: number;
  balance: number;
}) {
  const parsed = Number(amount);
  if (!amount.trim()) return `Minimum amount is ${formatBtcAmount(min)} BTC`;
  if (!Number.isFinite(parsed) || parsed <= 0) return "Enter a valid amount";
  const decimals = amount.split(".")[1];
  if (decimals && decimals.length > 8) {
    return "BTC can have up to 8 decimal places";
  }
  if (parsed < min) return `Minimum amount is ${formatBtcAmount(min)} BTC`;
  if (parsed > balance) return "Insufficient BTC balance";
  if (cap > 0 && parsed > cap)
    return `Current cap is ${formatBtcAmount(cap)} BTC`;
  return null;
}

export function BridgeHomeScreen() {
  const router = useRouter();
  const config = useBridgeConfig();
  const { stxAddress, btcAddress, sbtcBalance } = useBridgeBalances();
  const history = useBridgeHistoryData();
  const { currentCap, limits } = useBridgeCurrentCap();
  const overview = useBridgeOverviewMetrics();
  const btcBalance = useBtcBalance();
  const deposit = useSubmitDeposit(config);
  const withdraw = useSubmitWithdrawal(config, stxAddress);
  const maxFee = useWithdrawalMaxFee(config);
  const bridgeFees = useBridgeFeeRecommendation(config);
  const confirmModal = useModal();
  const confirmWithdrawModal = useModal();
  const { hasAccepted, acceptTerms } = useBridgeTerms();

  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState(btcAddress ?? "");
  const [feeRateTier, setFeeRateTier] = useState<FeeRateTier>("standard");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "deposit" | "withdraw" | null
  >(null);

  const preparedDeposit = usePrepareBridgeDeposit(
    config,
    stxAddress,
    depositAmount,
    feeRateTier,
    isConfirmOpen,
  );

  useEffect(() => {
    if (!withdrawAddress && btcAddress) {
      setWithdrawAddress(btcAddress);
    }
  }, [btcAddress, withdrawAddress]);

  // --- Derived values ---
  const minDeposit = fromSatsToBtc(limits.data?.perDepositMinimum ?? 0);
  const maxDeposit = fromSatsToBtc(currentCap);
  const sbtcBalanceBtc = fromSatsToBtc(sbtcBalance.data ?? 0n);
  const withdrawMaxFeeBtc = fromSatsToBtc(maxFee.data ?? 0);
  const availableWithdrawalCap = Math.min(
    fromSatsToBtc(limits.data?.perWithdrawalCap ?? 0),
    fromSatsToBtc(limits.data?.availableToWithdraw ?? 0),
  );
  const maxWithdrawAmount = Math.max(
    0,
    Math.min(availableWithdrawalCap, sbtcBalanceBtc - withdrawMaxFeeBtc),
  );
  const depositMaxAmount =
    btcBalance.balance > 0
      ? maxDeposit > 0
        ? Math.min(maxDeposit, btcBalance.balance)
        : btcBalance.balance
      : 0;
  const depositMaxValue =
    depositMaxAmount > 0 ? formatBtcInput(depositMaxAmount) : undefined;
  const hasBitcoinBalance = btcBalance.balanceSats > 0;
  const withdrawMaxValue =
    maxWithdrawAmount > 0 ? formatBtcInput(maxWithdrawAmount) : undefined;

  // --- Errors ---
  const depositError = useMemo(
    () =>
      getDepositAmountError({
        amount: depositAmount,
        min: minDeposit,
        cap: maxDeposit,
        balance: btcBalance.balance,
      }),
    [btcBalance.balance, depositAmount, maxDeposit, minDeposit],
  );

  const withdrawError = useMemo(() => {
    const parsed = Number(withdrawAmount);
    if (!withdrawAmount.trim()) return "Amount is required";
    if (!Number.isFinite(parsed) || parsed <= 0) return "Enter a valid amount";
    const decimals = withdrawAmount.split(".")[1];
    if (decimals && decimals.length > 8) {
      return "BTC can have up to 8 decimal places";
    }
    if (parsed < fromSatsToBtc(config.withdrawMinAmountSats)) {
      return `Minimum amount is ${formatBtcAmount(
        fromSatsToBtc(config.withdrawMinAmountSats),
      )} BTC`;
    }
    if (availableWithdrawalCap > 0 && parsed > availableWithdrawalCap) {
      return `Current withdrawal cap is ${formatBtcAmount(availableWithdrawalCap)} BTC`;
    }
    if (parsed + withdrawMaxFeeBtc > sbtcBalanceBtc) {
      return "Insufficient sBTC balance for amount plus fee";
    }
    return null;
  }, [
    availableWithdrawalCap,
    config.withdrawMinAmountSats,
    sbtcBalanceBtc,
    withdrawAmount,
    withdrawMaxFeeBtc,
  ]);

  const withdrawAddressError = useMemo(() => {
    if (!withdrawAddress.trim()) return "Bitcoin address is required";
    if (!validateBitcoinAddress(withdrawAddress, config.network)) {
      return config.network === "mainnet"
        ? "Enter a valid mainnet Bitcoin address"
        : "Enter a valid testnet Bitcoin address";
    }
    return null;
  }, [config.network, withdrawAddress]);

  // --- Disabled states ---
  const isDepositDisabled =
    !hasBitcoinBalance || Boolean(depositError) || !btcAddress || !stxAddress;
  const isWithdrawalFeeReady =
    maxFee.data != null && Number.isFinite(maxFee.data) && maxFee.data > 0;
  const isWithdrawalDisabled =
    !isWithdrawalFeeReady ||
    maxFee.isLoading ||
    maxFee.isError ||
    limits.isLoading ||
    Boolean(withdrawError) ||
    Boolean(withdrawAddressError);

  // --- Chip lists ---
  const depositInfoChips = [
    {
      label: "Minimum deposit",
      value: `${formatBtcAmount(minDeposit)} BTC`,
    },
    {
      label: "Network fee",
      value:
        bridgeFees.data?.halfHourFee != null
          ? `${bridgeFees.data.halfHourFee} sat/vB`
          : "loading",
    },
    {
      label: "Total confirmation time",
      value: "~60 min",
      tooltip:
        "Bitcoin deposits require 6 block confirmations (~60 minutes) before sBTC is minted to your Stacks wallet. Network conditions can change the timing.",
    },
  ];

  const withdrawalInfoChips = [
    {
      label: "Min. withdrawal",
      value: `${formatBtcAmount(fromSatsToBtc(config.withdrawMinAmountSats))} sBTC`,
    },
    {
      label: "Max fee",
      value: `${formatBtcAmount(withdrawMaxFeeBtc)} BTC`,
    },
    {
      label: "Total confirmation time",
      value: "~30 min",
      tooltip:
        "Withdrawals are processed on the Stacks blockchain and typically complete within ~30 minutes, depending on network activity and signer processing.",
    },
  ];

  // --- Overview ---
  const overviewItems: StatItem[] = [
    {
      label: "sBTC current supply",
      value: formatBtcMetric(overview.supplyBtc),
      unit: "sBTC",
    },
    {
      label: "sBTC market cap",
      value: formatUsdCompact(overview.marketCapUsd),
      prefix: "$",
    },
    {
      label: "Uptime (30 days)",
      value: "100",
      unit: "%",
    },
    {
      label: "Total sBTC minted",
      value: formatBtcMetric(overview.minDepositBtc),
      unit: "BTC",
    },
  ];

  // --- Handlers ---
  const handleDepositPress = () => {
    if (depositError) {
      showMessage({
        message: "Invalid deposit",
        description: depositError,
        type: "warning",
      });
      return;
    }
    if (!hasAccepted) {
      setPendingAction("deposit");
      setIsTermsOpen(true);
      return;
    }
    setIsConfirmOpen(true);
    confirmModal.present();
  };

  const handleWithdrawPress = () => {
    if (!isWithdrawalFeeReady) {
      showMessage({
        message: "Withdrawal unavailable",
        description:
          "The bridge fee estimate is still loading. Please try again in a moment.",
        type: "warning",
      });
      return;
    }
    const nextError = withdrawError || withdrawAddressError;
    if (nextError) {
      showMessage({
        message: "Invalid withdrawal",
        description: nextError,
        type: "warning",
      });
      return;
    }
    if (!hasAccepted) {
      setPendingAction("withdraw");
      setIsTermsOpen(true);
      return;
    }
    confirmWithdrawModal.present();
  };

  const handleTermsAccept = async () => {
    await acceptTerms();
    if (pendingAction === "deposit") {
      setIsConfirmOpen(true);
      confirmModal.present();
    } else if (pendingAction === "withdraw") {
      confirmWithdrawModal.present();
    }
    setPendingAction(null);
  };

  const handleConfirmWithdraw = async () => {
    try {
      const txId = await withdraw.mutateAsync({
        amount: withdrawAmount,
        recipientAddress: withdrawAddress,
      });
      confirmWithdrawModal.dismiss();
      router.push({
        pathname: "/Earn/sbtc-bridge/withdraw/[id]",
        params: { id: txId },
      });
    } catch {
      // error shown via flash message in mutation onError
    }
  };

  const handleConfirmDeposit = async () => {
    if (!preparedDeposit.data) return;
    try {
      const submitted = await deposit.mutateAsync(preparedDeposit.data);
      confirmModal.dismiss();
      setIsConfirmOpen(false);
      router.push({
        pathname: "/Earn/sbtc-bridge/deposit/[txid]",
        params: {
          txid: submitted.txId,
          vout: String(submitted.vout),
        },
      });
    } catch {
      // error shown via flash message in mutation onError
    }
  };

  return (
    <BridgeHomeLayout
      overview={{
        hero: {
          label: "BTC locked in protocol",
          value: formatBtcMetric(overview.supplyBtc),
          unit: "BTC",
        },
        items: overviewItems,
      }}
      bridgeUnavailable={!config.isEnabled}
      tab={tab}
      onTabChange={setTab}
      deposit={{
        btcAddress,
        stxAddress,
        amount: depositAmount,
        onAmountChange: setDepositAmount,
        error: depositError,
        maxValue: depositMaxValue,
        onMax: depositMaxValue
          ? () => setDepositAmount(depositMaxValue)
          : undefined,
        btcBalance: btcBalance.balance,
        isDisabled: isDepositDisabled,
        onPress: handleDepositPress,
        infoChips: depositInfoChips,
      }}
      withdraw={{
        sbtcBalanceBtc,
        amount: withdrawAmount,
        onAmountChange: setWithdrawAmount,
        error: withdrawError,
        maxValue: withdrawMaxValue,
        onMax: withdrawMaxValue
          ? () => setWithdrawAmount(withdrawMaxValue)
          : undefined,
        address: withdrawAddress,
        onAddressChange: setWithdrawAddress,
        addressError: withdrawAddressError,
        isDisabled: isWithdrawalDisabled,
        onPress: handleWithdrawPress,
        infoChips: withdrawalInfoChips,
      }}
      history={{
        items: history.items,
        config,
        isLoading:
          history.deposits.isLoading ||
          history.localDeposits.isLoading ||
          history.withdrawals.isLoading,
      }}
      terms={{
        isOpen: isTermsOpen,
        onOpenChange: setIsTermsOpen,
        onAccept: handleTermsAccept,
      }}
      confirmDeposit={{
        ref: confirmModal.ref,
        preparedDeposit: preparedDeposit.data,
        isFetching: preparedDeposit.isFetching,
        error: preparedDeposit.error,
        feeRateTier,
        onFeeRateTierChange: setFeeRateTier,
        isPending: deposit.isPending,
        depositAmount,
        onDismiss: () => {
          confirmModal.dismiss();
          setIsConfirmOpen(false);
        },
        onConfirm: handleConfirmDeposit,
      }}
      confirmWithdraw={{
        ref: confirmWithdrawModal.ref,
        withdrawAmount,
        withdrawAddress,
        maxFeeBtc: withdrawMaxFeeBtc,
        isPending: withdraw.isPending,
        onDismiss: () => confirmWithdrawModal.dismiss(),
        onConfirm: handleConfirmWithdraw,
      }}
    />
  );
}
