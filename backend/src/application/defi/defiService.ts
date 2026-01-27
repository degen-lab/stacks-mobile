import { BitflowSDK, QuoteResult, SelectedSwapRoute, SwapDataParamsAndPostConditions, SwapExecutionData, SwapOptions, Token } from "@bitflowlabs/core-sdk";
import { SWAP_SLIPPAGE_TOLLERANCE } from "../../shared/constants";
import { SwapRouteNotFoundError } from "../errors/defiErrors";

export class DefiService {

  constructor(
    private bitflowClient: BitflowSDK,
  ) {}

  async getTokenList(): Promise<Token[]> { 
    return await this.bitflowClient.getAvailableTokens();
  }

  async getPossiblePairList(tokenId: string): Promise<SwapOptions> {
    return await this.bitflowClient.getPossibleSwaps(tokenId);
  }

  async getSwapParams(tokenInId: string, tokenOutId: string, senderAddress: string, amount: number): Promise<SwapDataParamsAndPostConditions> {
    const quote: QuoteResult = await this.bitflowClient.getQuoteForRoute(tokenInId, tokenOutId, amount);
    
    if (!quote.bestRoute || quote.allRoutes.length === 0) {
      throw new SwapRouteNotFoundError(`Couldn't find route between the desired pair`); 
    }
    
    let route: SelectedSwapRoute;
    if (quote.bestRoute) {
      route = quote.bestRoute.route;
    } else {
      route = quote.allRoutes[0].route;
    }
    
    const swapExecutionData: SwapExecutionData = {
      route,
      amount,
      tokenXDecimals:route.tokenXDecimals,
      tokenYDecimals:route.tokenYDecimals,
    };
    return await this.bitflowClient.getSwapParams(
      swapExecutionData,
      senderAddress,
      SWAP_SLIPPAGE_TOLLERANCE,
    );
  } 
}
