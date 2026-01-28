import {
  BitflowSDK,
  QuoteResult,
  SelectedSwapRoute,
  SwapDataParamsAndPostConditions,
  SwapExecutionData,
  SwapOptions,
  Token,
} from '@bitflowlabs/core-sdk';
import { SWAP_SLIPPAGE_TOLLERANCE } from '../../shared/constants';
import {
  DefiOperationNotFoundError,
  SwapRouteNotFoundError,
} from '../errors/defiErrors';
import { EntityManager } from 'typeorm';
import { TransactionClientPort } from '../ports/transactionClientPort';
import {
  DefiOperationType,
  TransactionStatus,
} from '../../domain/entities/enums';
import { User } from '../../domain/entities/user';
import { UserNotFoundError } from '../errors/userErrors';
import { DefiOperation } from '../../domain/entities/defiOperation';
import { DefiOperationMetadata } from '../../domain/helpers/types';

export class DefiService {
  constructor(
    private entityManager: EntityManager,
    private bitflowClient: BitflowSDK,
    private transactionClient: TransactionClientPort,
  ) {}

  async getTokenList(): Promise<Token[]> {
    return await this.bitflowClient.getAvailableTokens();
  }

  async getPossiblePairList(tokenId: string): Promise<SwapOptions> {
    return await this.bitflowClient.getPossibleSwaps(tokenId);
  }

  async getSwapParams(
    userId: number,
    tokenInId: string,
    tokenOutId: string,
    senderAddress: string,
    amount: number,
  ): Promise<{
    defiOperation: DefiOperation;
    contractCallParams: SwapDataParamsAndPostConditions;
  }> {
    const quote: QuoteResult = await this.bitflowClient.getQuoteForRoute(
      tokenInId,
      tokenOutId,
      amount,
    );

    if (!quote.bestRoute || quote.allRoutes.length === 0) {
      throw new SwapRouteNotFoundError(
        `Couldn't find route between the desired pair`,
      );
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
      tokenXDecimals: route.tokenXDecimals,
      tokenYDecimals: route.tokenYDecimals,
    };

    const user = await this.entityManager.findOne(User, {
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found!`);
    }

    const operationMetadata: DefiOperationMetadata = {
      tokenIn: tokenInId,
      tokenOut: tokenOutId,
      amount,
    };

    const defiOperation = new DefiOperation();
    defiOperation.metadata = operationMetadata;
    defiOperation.status = TransactionStatus.NotBroadcasted;
    defiOperation.operationType = DefiOperationType.Swap;
    defiOperation.senderAddress = senderAddress;
    defiOperation.user = user;
    const savedOperation = await this.entityManager.save(defiOperation);
    return {
      defiOperation: savedOperation,
      contractCallParams: await this.bitflowClient.getSwapParams(
        swapExecutionData,
        senderAddress,
        SWAP_SLIPPAGE_TOLLERANCE,
      ),
    };
  }

  async updateDefiOperation(
    userId: number,
    defiOperationId: number,
    txId: string,
  ): Promise<void> {
    const defiOperation = await this.entityManager.findOne(DefiOperation, {
      where: {
        id: defiOperationId,
        user: {
          id: userId,
        },
      },
    });

    if (!defiOperation) {
      throw new DefiOperationNotFoundError(
        `Defi operation with id ${defiOperationId} not found for user with id ${userId}`,
      );
    }

    const transactionStatus =
      await this.transactionClient.getTransactionStatus(txId);
    const txStatus =
      transactionStatus === 'success'
        ? TransactionStatus.Success
        : transactionStatus === 'pending'
          ? TransactionStatus.Pending
          : TransactionStatus.Failed;
    defiOperation.status = txStatus;
    defiOperation.txId = txId;
    await this.entityManager.save(defiOperation);
  }
}
