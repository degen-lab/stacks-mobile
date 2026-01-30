import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTxById } from "@/api/stacks/use-stacks-api";

type Props = {
  txId: string | null;
  onSuccess?: () => void;
  onFailure?: (status: string, repr?: string) => void;
};

export function useTrackTx({ txId, onSuccess, onFailure }: Props) {
  const queryClient = useQueryClient();
  const { data } = useTxById({
    variables: { txId: txId ?? "" },
    enabled: !!txId,
  });
  const status = data?.tx_status as string | undefined;

  useEffect(() => {
    if (!txId || !status) return;

    if (status === "success") {
      // Invalidate stacking queries to refetch isAllowed status
      queryClient.invalidateQueries({ queryKey: ["stacking"] });
      onSuccess?.();
    } else if (["failed", "abort_by_response", "rejected"].includes(status)) {
      onFailure?.(status, (data as any)?.tx_result?.repr);
    }
  }, [txId, status, data, onSuccess, onFailure, queryClient]);

  const isPending =
    !!txId &&
    (!status ||
      (status !== "success" &&
        !["failed", "abort_by_response", "rejected"].includes(status)));

  return {
    status,
    isPending,
    isSuccess: status === "success",
    isFailure: ["failed", "abort_by_response", "rejected"].includes(
      status ?? "",
    ),
  };
}
