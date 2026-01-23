import { IStackingPoolClient } from "../../application/ports/IStackingPoolClient";
import { FAST_POOL_STACKING_DATA_JSON_URL } from "../../shared/constants";

export class FastPoolClient implements IStackingPoolClient {
    async delegationTotalRewards(address: string, startCycleId: number, endCycleId: number): Promise<number> {
      const res = await fetch(FAST_POOL_STACKING_DATA_JSON_URL(address), {
        headers: {
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });

      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const encodedJsonContent = data.content;
      const decodedContent =  Buffer.from(encodedJsonContent, 'base64').toString();
      const jsonStackingData = JSON.parse(decodedContent);
      let totalStackingRewards: number = 0;
      for(let i = startCycleId; i < endCycleId; i += 1) {
        if (!jsonStackingData.cycles[`${i}`]) {
          break;
        }
        totalStackingRewards += jsonStackingData.cycles[`${i}`].rewards;
      }
      return totalStackingRewards;
    }
}
