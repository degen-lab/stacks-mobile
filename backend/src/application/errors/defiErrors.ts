import { BaseError } from "../../shared/errors/baseError";

export class SwapRouteNotFoundError extends BaseError {
  readonly name: string = 'SWAP_ROUTE_NOT_FOUND_ERROR';
  readonly statusCode: number = 400;

  constructor(message: string) {
    super(message);
  }
}

