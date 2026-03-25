import type { AxiosError } from "axios";
import { isAxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { hiroApiClient } from "@/api/common/stacks-client";

export type FtMetadata = {
  asset_identifier: string;
  decimals: number;
  description?: string | null;
  image_canonical_uri: string | null;
  image_thumbnail_uri: string | null;
  image_uri: string | null;
  name: string | null;
  symbol: string | null;
  token_uri: string | null;
};

type FtMetadataMap = Record<string, FtMetadata | null>;

type Variables = {
  principals: string[];
};

export const useFtMetadataMap = createQuery<
  FtMetadataMap,
  Variables,
  AxiosError
>({
  queryKey: ["stacks-ft-metadata-map"],
  fetcher: async ({ principals }) => {
    const uniquePrincipals = [...new Set(principals)]
      .map((principal) => principal.trim())
      .filter(Boolean);

    if (!uniquePrincipals.length) return {};

    const metadataEntries = await Promise.all(
      uniquePrincipals.map(async (principal) => {
        try {
          const response = await hiroApiClient.get<FtMetadata>(
            `https://api.hiro.so/metadata/v1/ft/${encodeURIComponent(principal)}`,
          );

          return [principal.toLowerCase(), response.data] as const;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return [principal.toLowerCase(), null] as const;
          }

          throw error;
        }
      }),
    );

    return Object.fromEntries(metadataEntries);
  },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
});
