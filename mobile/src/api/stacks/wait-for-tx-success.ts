import { queryClient } from "@/api/common/api-provider";

import { Transaction } from "./types/transaction";
import { useTxById } from "./use-stacks-api";

const TERMINAL_FAILURE = new Set([
  "failed",
  "abort_by_response",
  "abort_by_post_condition",
  "rejected",
]);

type WaitForTxSuccessResult =
  | { ok: true; data: Transaction }
  | { ok: false; data?: Transaction; reason?: "timeout" | "error" };

type WaitForTxSuccessOptions = {
  intervalMs?: number;
  timeoutMs?: number;
};

export async function waitForTxSuccess(
  txId: string,
  { intervalMs = 2500, timeoutMs = 120000 }: WaitForTxSuccessOptions = {},
): Promise<WaitForTxSuccessResult> {
  const deadline = Date.now() + timeoutMs;

  while (true) {
    try {
      const data = await queryClient.fetchQuery(
        useTxById.getFetchOptions({ txId }),
      );

      if (data.tx_status === "success") {
        return { ok: true, data };
      }

      if (TERMINAL_FAILURE.has(data.tx_status)) {
        return { ok: false, data };
      }
    } catch {
      return { ok: false, reason: "error" };
    }

    if (Date.now() > deadline) {
      return { ok: false, reason: "timeout" };
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
