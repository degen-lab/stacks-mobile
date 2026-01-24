import { IStackingPoolClient } from "../../application/ports/IStackingPoolClient";
import { FAST_POOL_STACKING_DATA_JSON_URL, FAST_POOL_REWARDS_COMMITS_URL } from "../../shared/constants";

export class FastPoolClient implements IStackingPoolClient {
    async delegationTotalRewards(address: string, startCycleId: number, endCycleId: number | null): Promise<number> {
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
      
      const maxCycles = endCycleId ?? Number.MAX_SAFE_INTEGER;
      
      for(let i = startCycleId; i < maxCycles; i += 1) {
        if (!jsonStackingData.cycles[`${i}`]) {
          break;
        }
        totalStackingRewards += jsonStackingData.cycles[`${i}`].rewards;
      }
      return totalStackingRewards;
    }

    async getRewardFolderRef(): Promise<string> {
      const res = await fetch(FAST_POOL_REWARDS_COMMITS_URL, {
        headers: {
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });

      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }

      const commits = await res.json();
      
      // Return the SHA of the latest commit
      if (!commits || commits.length === 0) {
        throw new Error('No commits found for rewards folder');
      }

      return commits[0].sha;
    }
}
