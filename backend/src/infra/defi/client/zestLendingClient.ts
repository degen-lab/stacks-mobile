import { LendingClientPort } from "../../../application/ports/LendingClientPort";
import { ZEST_LENDING_ASSETS } from "./lendingAssets";

export class ZestLendingClient implements LendingClientPort {
    getAssetsToSupply(): Object {
      return ZEST_LENDING_ASSETS;
    }

}
