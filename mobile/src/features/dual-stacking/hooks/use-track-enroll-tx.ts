import { useEffect } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

import { useTxById } from "@/api/stacks/use-stacks-api";

export const invalidateEnrollmentQueries = (qc: QueryClient) =>
  qc.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey.join(":");
      return (
        k.includes("IS_ENROLLED_THIS_CYCLE") ||
        k.includes("IS_ENROLLED_NEXT_CYCLE")
      );
    },
  });

type Props = {
  txId: string | null;
  onSuccess?: () => void;
  onFailure?: (status: string, repr?: string) => void;
};

export function useTrackEnrollTx({ txId, onSuccess, onFailure }: Props) {
  const qc = useQueryClient();
  const { data } = useTxById({
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
      return 3000;
    },
  });

  const status = data?.tx_status;

  useEffect(() => {
    if (!txId || !status) return;

    if (status === "success") {
      onSuccess?.();
      invalidateEnrollmentQueries(qc);
    } else if (["failed", "abort_by_response", "rejected"].includes(status)) {
      onFailure?.(status, (data as any)?.tx_result?.repr);
    }
  }, [txId, status, data, onSuccess, onFailure, qc]);

  return {
    status,
    isPending:
      !!txId &&
      (!status ||
        (status !== "success" &&
          !["failed", "abort_by_response", "rejected"].includes(status))),
    isSuccess: status === "success",
    isFailure: ["failed", "abort_by_response", "rejected"].includes(
      status ?? "",
    ),
  };
}
