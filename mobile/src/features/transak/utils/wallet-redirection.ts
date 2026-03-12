type WalletRedirectionPayload = {
  walletAddress: string;
  cryptoAmount: string;
  cryptoCurrency?: string;
  network?: string;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const asAmount = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const numeric = Number(trimmed);
    if (trimmed && Number.isFinite(numeric) && numeric > 0) {
      return trimmed;
    }
  }
  return undefined;
};

export const parseWalletRedirectionPayload = (
  value: unknown,
): WalletRedirectionPayload | null => {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const walletAddress = asString(
    candidate.walletAddress ??
      candidate.address ??
      candidate.destinationAddress,
  );
  const cryptoAmount = asAmount(
    candidate.cryptoAmount ?? candidate.amount ?? candidate.requestedAmount,
  );

  if (!walletAddress || !cryptoAmount) {
    return null;
  }

  return {
    walletAddress,
    cryptoAmount,
    cryptoCurrency: asString(candidate.cryptoCurrency),
    network: asString(candidate.network),
  };
};
