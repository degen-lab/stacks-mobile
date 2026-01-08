import { BaseError } from '../../shared/errors/baseError';

export class QuantityNotProvidedError extends BaseError {
  readonly name = 'QuantityNotProvidedError';
  readonly statusCode = 400;

  constructor(message = 'Quantity is required for consumable items') {
    super(message);
  }
}

export class InsufficientPointsError extends BaseError {
  readonly name = 'InsufficientPointsError';
  readonly statusCode = 400;

  constructor(
    message = 'User does not have enough points to purchase this item',
  ) {
    super(message);
  }
}

export class ItemNotFoundError extends BaseError {
  readonly name = 'ItemNotFoundError';
  readonly statusCode = 404;

  constructor(message = 'Item not found') {
    super(message);
  }
}

export class InvalidItemVariantError extends BaseError {
  readonly name = 'InvalidItemVariantError';
  readonly statusCode = 400;

  constructor(message = 'Item type does not match variant') {
    super(message);
  }
}
