import { LendingClientPort } from '../../../application/ports/LendingClientPort';
import { ZEST_LENDING_ASSETS } from './lendingAssets';

export class ZestLendingClient implements LendingClientPort {
  getAssetsToSupply(): object {
    return ZEST_LENDING_ASSETS;
  }
}
