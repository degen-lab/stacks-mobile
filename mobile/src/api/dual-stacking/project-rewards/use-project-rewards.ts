import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { dualStackingClient } from "../../common/backend-client";
import type { ProjectRewardsParams, ProjectRewardsResponse } from "./types";

type Response = ProjectRewardsResponse;
type Variables = ProjectRewardsParams;

export const useProjectRewards = createQuery<Response, Variables, AxiosError>({
  queryKey: ["project-rewards"],
  fetcher: async (variables) => {
    const params: Record<string, string> = {
      address: variables.address,
      max_apr: String(variables.maxApr),
    };

    if (variables.stx !== undefined) params.stx = String(variables.stx);
    if (variables.sbtcWallet !== undefined)
      params.sbtc_wallet = String(variables.sbtcWallet);
    if (variables.sbtcDefi !== undefined)
      params.sbtc_defi = String(variables.sbtcDefi);
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
