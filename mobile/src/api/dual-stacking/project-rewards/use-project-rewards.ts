import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { dualStackingClient } from "../../common/backend-client";
import type { ProjectRewardsParams, ProjectRewardsResponse } from "./types";

type Response = ProjectRewardsResponse;
type Variables = ProjectRewardsParams;

export const useProjectRewards = createQuery<Response, Variables, AxiosError>({
  queryKey: ["project-rewards"],
  fetcher: async (variables) => {
    // FIX: Always send balance params (API requires them, defaults to 0)
    const params: Record<string, string> = {
      address: variables.address,
      max_apr: String(variables.maxApr),
      stx: String(variables.stx ?? 0),
      sbtc_wallet: String(variables.sbtcWallet ?? 0),
      sbtc_defi: String(variables.sbtcDefi ?? 0),
    };

    if (variables.whitelisted !== undefined)
      params.whitelisted = String(variables.whitelisted);

    const { data } = await dualStackingClient.get<ProjectRewardsResponse>(
      "/project-rewards",
      {
        params,
      },
    );
    return data;
  },
});
