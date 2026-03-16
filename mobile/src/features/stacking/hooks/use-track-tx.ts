import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTxById } from "@/api/stacks/use-stacks-api";

type Props = {
  txId: string | null;
  onSuccess?: () => void;
  onFailure?: (status: string, repr?: string) => void;
  invalidateQueries?: unknown[][]; // Array of query keys to invalidate on success
};

export function useTrackTx({
  txId,
  onSuccess,
  onFailure,
  invalidateQueries,
}: Props) {
  const queryClient = useQueryClient();
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
      if (invalidateQueries && invalidateQueries.length > 0) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["stacking"] });
      }
      onSuccess?.();
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
    queryClient,
    invalidateQueries,
  ]);

  const hasLookupFailure = isError && failureCount >= 5;
  const hasTerminalStatus =
    status === "success" ||
    ["failed", "abort_by_response", "rejected"].includes(status ?? "");
  const isPending = !!txId && !hasTerminalStatus && !hasLookupFailure;

  return {
    status,
    isPending,
    isSuccess: status === "success",
    isFailure: ["failed", "abort_by_response", "rejected"].includes(
      status ?? "",
    ),
  };
}
