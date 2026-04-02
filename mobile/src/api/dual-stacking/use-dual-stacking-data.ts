import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { isMainnet } from "@/lib/stacks/network";
import { dualStackingClient } from "../common/backend-client";
import type { DualStackingDataResponse } from "./types";

type Response = DualStackingDataResponse;
type Variables = void;

export const useDualStackingData = createQuery<Response, Variables, AxiosError>(
  {
    queryKey: ["dual-stacking-data"],
    fetcher: async () => {
      const normalizePayload = (raw: unknown): DualStackingDataResponse => {
        if (Array.isArray(raw)) return raw as DualStackingDataResponse;
        if (raw && typeof raw === "object") {
          const payload = raw as Record<string, unknown>;
          if (Array.isArray(payload.data)) {
            return payload.data as DualStackingDataResponse;
          }
          if (Array.isArray(payload.cycles)) {
            return payload.cycles as DualStackingDataResponse;
          }
          if (Array.isArray(payload.rows)) {
            return payload.rows as DualStackingDataResponse;
          }
        }
        return [];
      };

      const { data } = await dualStackingClient.get<DualStackingDataResponse>(
        "/dual-stacking-data",
        {
          params: {
            network: isMainnet() ? "mainnet" : "testnet",
          },
        },
      );
      return normalizePayload(data);
    },
  },
);
