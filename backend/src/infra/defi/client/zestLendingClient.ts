import { LendingClientPort } from '../../../application/ports/LendingClientPort';
import { ZEST_LENDING_ASSETS } from '../lendingAssets';

export class ZestLendingClient implements LendingClientPort {
  async getAssetsToSupply(): Promise<object> {
    return ZEST_LENDING_ASSETS;
  }
}
