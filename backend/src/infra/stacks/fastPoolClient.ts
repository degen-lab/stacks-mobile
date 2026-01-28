import { StackingPoolClientPort } from '../../application/ports/stackingPoolClientPort';
import {
  FAST_POOL_STACKING_DATA_JSON_URL,
  FAST_POOL_REWARDS_COMMITS_URL,
  GITHUB_API_KEY,
} from '../../shared/constants';
import { logger } from '../../api/helpers/logger';

export class FastPoolClient implements StackingPoolClientPort {
  async delegationTotalRewards(
    address: string,
    startCycleId: number,
    endCycleId: number | null,
  ): Promise<number> {
    const url = FAST_POOL_STACKING_DATA_JSON_URL(address);
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_API_KEY}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        logger.info({
          msg: 'No stacking data file found for address on GitHub',
          address,
          url,
        });
        return 0; // No rewards if file doesn't exist yet
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const encodedJsonContent = data.content;
    const decodedContent = Buffer.from(encodedJsonContent, 'base64').toString();
    const jsonStackingData = JSON.parse(decodedContent);
    let totalStackingRewards: number = 0;

    const maxCycles = endCycleId ?? Number.MAX_SAFE_INTEGER;

    for (let i = startCycleId; i < maxCycles; i += 1) {
      const cycle = jsonStackingData.cycles?.[`${i}`];
      if (!cycle) {
        logger.info({
          msg: 'Cycle not found in stacking data, stopping',
          address,
          cycleId: i,
          startCycleId,
          endCycleId,
        });
        break;
      }
      const rewards = cycle.rewards;
      if (rewards !== undefined && rewards !== null && !isNaN(rewards)) {
        totalStackingRewards += rewards;
      } else {
        logger.warn({
          msg: 'Invalid rewards value for cycle',
          address,
          cycleId: i,
          rewards,
        });
      }
    }

    logger.info({
      msg: 'Total stacking rewards calculated',
      address,
      startCycleId,
      endCycleId,
      totalStackingRewards,
    });

    return totalStackingRewards;
  }

  async getRewardFolderRef(): Promise<string> {
    const res = await fetch(FAST_POOL_REWARDS_COMMITS_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_API_KEY}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
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
