export const extractUnit = (message: string): string | undefined => {
  const matches = message.match(/\b[A-Z]{2,6}\b/g);
  return matches ? matches[matches.length - 1] : undefined;
};

export const parseTransakError = (message: string) => {
  if (message.includes("feature is not enabled")) {
    return { kind: "feature" as const };
  }

  // Network fee exceeds amount (essentially a minimum amount error)
  if (message.includes("network fee is more than the source amount")) {
    return {
      kind: "min" as const,
      minAmount: undefined, // Transak doesn't provide exact minimum in this error
      unit: extractUnit(message),
    };
  }

  const minMatch = message.match(
    /minimum .*?(?:more than or equal to|>=)\s*([0-9]*\.?[0-9]+)/i,
  );
  if (minMatch) {
    return {
      kind: "min" as const,
      minAmount: Number(minMatch[1]),
      unit: extractUnit(message),
    };
  }

  const maxMatch = message.match(
    /less than (?:or equal to )?([0-9]*\.?[0-9]+)/i,
  );
  if (maxMatch) {
    return {
      kind: "max" as const,
      maxAmount: Number(maxMatch[1]),
      unit: extractUnit(message),
    };
  }

  return { kind: "unknown" as const };
};
