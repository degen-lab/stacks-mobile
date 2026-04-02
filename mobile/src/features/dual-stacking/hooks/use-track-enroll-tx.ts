import { useEffect } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

import { useTxById } from "@/api/stacks/use-stacks-api";
import type { IsEnrolledResponse } from "@/api/dual-stacking/types";

export const IS_ENROLLED_QUERY_KEY = "is-enrolled" as const;

export const invalidateEnrollmentQueries = (qc: QueryClient) =>
  qc.invalidateQueries({ queryKey: [IS_ENROLLED_QUERY_KEY] });

/**
 * Optimistically sets enrollment state in the cache so the UI updates
 * immediately after tx confirmation, without waiting for the backend indexer.
 */
export const optimisticSetEnrolled = (
  qc: QueryClient,
  enrolled: Partial<IsEnrolledResponse>,
) => {
  qc.setQueriesData<IsEnrolledResponse>(
    { queryKey: [IS_ENROLLED_QUERY_KEY] },
    (old) => (old ? { ...old, ...enrolled } : old),
  );
};

type Props = {
  txId: string | null;
  onSuccess?: () => void;
  onFailure?: (status: string, repr?: string) => void;
};

export function useTrackEnrollTx({ txId, onSuccess, onFailure }: Props) {
  const qc = useQueryClient();
  const { data, error, isError, failureCount } = useTxById({
    variables: { txId: txId ?? "" },
    enabled: !!txId,
    refetchInterval: (query) => {
      const status = query.state.data?.tx_status;
      if (
        status === "success" ||
        (status && ["failed", "abort_by_response", "rejected"].includes(status))
      ) {
        return false;
      }
      if (query.state.error && query.state.fetchFailureCount >= 5) {
        return false;
      }
      return 3000;
    },
  });

  const status = data?.tx_status;

  useEffect(() => {
    if (!txId) return;

    if (isError && failureCount >= 5) {
      const httpStatus = (error as any)?.response?.status;
      if (httpStatus === 404) {
        onFailure?.(
          "not_found",
          "Transaction not found on the selected network.",
        );
      } else {
        onFailure?.(
          "lookup_failed",
          error instanceof Error ? error.message : String(error),
        );
      }
      return;
    }

    if (!status) return;

    if (status === "success") {
      onSuccess?.();
      // Delay invalidation so the backend indexer has time to process the
      // confirmed block — prevents the refetch from overwriting optimistic updates.
      const t = setTimeout(() => invalidateEnrollmentQueries(qc), 20_000);
      return () => clearTimeout(t);
    } else if (["failed", "abort_by_response", "rejected"].includes(status)) {
      onFailure?.(status, (data as any)?.tx_result?.repr);
    }
  }, [
    txId,
    status,
    data,
    error,
    isError,
    failureCount,
    onSuccess,
    onFailure,
    qc,
  ]);

  const hasLookupFailure = isError && failureCount >= 5;
  const hasTerminalStatus =
    status === "success" ||
    ["failed", "abort_by_response", "rejected"].includes(status ?? "");

  return {
    status,
    isPending: !!txId && !hasTerminalStatus && !hasLookupFailure,
    isSuccess: status === "success",
    isFailure: ["failed", "abort_by_response", "rejected"].includes(
      status ?? "",
    ),
  };
}
