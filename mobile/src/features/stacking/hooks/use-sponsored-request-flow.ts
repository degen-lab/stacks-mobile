import { useEffect, useMemo, useRef } from "react";

import { useSponsoredTransactionStatus } from "@/api/game/transaction";

type StatusCopy = {
  title: string;
  message: string;
};

type SponsoredRequestCopy = {
  preparing: StatusCopy;
  verifying: StatusCopy;
  queued: StatusCopy;
  confirming?: StatusCopy;
  blocked?: StatusCopy;
};

type BroadcastedArgs = {
  requestId: number;
  status: "pending" | "success";
  txId?: string | null;
  originNonce?: number | null;
};

type FailedArgs = {
  requestId: number;
};

type UnavailableArgs = {
  requestId: number;
  error: unknown;
};

type UseSponsoredRequestFlowArgs = {
  requestId: number | null;
  copy: SponsoredRequestCopy;
  completeOn?: ("pending" | "success")[];
  onComplete?: (args: BroadcastedArgs) => void;
  onFailed?: (args: FailedArgs) => void;
  onStatusUnavailable?: (args: UnavailableArgs) => void;
};

export function useSponsoredRequestFlow({
  requestId,
  copy,
  completeOn = ["pending", "success"],
  onComplete,
  onFailed,
  onStatusUnavailable,
}: UseSponsoredRequestFlowArgs) {
  const handledOutcomeRef = useRef<string | null>(null);

  const {
    data: statusResponse,
    error: statusError,
    isError: isStatusError,
    failureCount: statusFailureCount,
  } = useSponsoredTransactionStatus({
    variables: { requestId: requestId ?? 0 },
    enabled: requestId !== null,
    retry: 2,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      const waitReason = query.state.data?.data?.waitReason;
      if (status === "failed" || status === "success") {
        return false;
      }
      if (status === "pending") {
        return completeOn.includes("pending") ? false : 8000;
      }
      if (status === "processing") {
        return waitReason === "previous_origin_pending" ? 10000 : 5000;
      }
      if (query.state.error && query.state.fetchFailureCount >= 3) {
        return false;
      }
      return 2000;
    },
  });

  const status = statusResponse?.data?.status ?? null;
  const waitReason = statusResponse?.data?.waitReason ?? null;
  const originNonce = statusResponse?.data?.originNonce ?? null;

  const loadingCopy = useMemo(() => {
    switch (status) {
      case "not_broadcasted":
        return copy.verifying;
      case "pending":
        return copy.confirming ?? copy.queued;
      case "processing":
        return waitReason === "previous_origin_pending"
          ? (copy.blocked ?? copy.queued)
          : copy.queued;
      default:
        return copy.preparing;
    }
  }, [
    copy.blocked,
    copy.confirming,
    copy.preparing,
    copy.queued,
    copy.verifying,
    status,
    waitReason,
  ]);

  useEffect(() => {
    if (requestId === null) {
      handledOutcomeRef.current = null;
    }
  }, [requestId]);

  useEffect(() => {
    if (requestId === null) return;
    if (!status || status === "not_broadcasted" || status === "processing") {
      return;
    }
    if (status === "pending" && !completeOn.includes("pending")) {
      return;
    }

    const handledKey = `${requestId}:${status}`;
    if (handledOutcomeRef.current === handledKey) return;
    handledOutcomeRef.current = handledKey;

    if (status === "failed") {
      onFailed?.({ requestId });
      return;
    }

    onComplete?.({
      requestId,
      status,
      txId: statusResponse?.data?.txId ?? null,
      originNonce: statusResponse?.data?.originNonce ?? null,
    });
  }, [
    completeOn,
    onComplete,
    onFailed,
    requestId,
    status,
    statusResponse?.data?.txId,
  ]);

  useEffect(() => {
    if (requestId === null || !isStatusError || statusFailureCount < 3) {
      return;
    }

    const handledKey = `${requestId}:unavailable`;
    if (handledOutcomeRef.current === handledKey) return;
    handledOutcomeRef.current = handledKey;

    onStatusUnavailable?.({
      requestId,
      error: statusError,
    });
  }, [
    isStatusError,
    onStatusUnavailable,
    requestId,
    statusError,
    statusFailureCount,
  ]);

  return {
    isBroadcasting: requestId !== null,
    loadingCopy,
    status,
    waitReason,
  };
}
