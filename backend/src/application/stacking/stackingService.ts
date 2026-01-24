import { EntityManager } from 'typeorm';
import { ITransactionClient } from '../ports/ITransactionClient';
import { StackingData } from '../../domain/entities/stackingData';
import { StxTransactionData } from '../../shared/types';
import {
  RewardFolderRefNotCached,
  StackingDataNotFoundError,
  WrongStackingFunctionError,
} from '../errors/stackingDataErrors';
import { UserNotFoundError } from '../errors/userErrors';
import { User } from '../../domain/entities/user';
import { IStackingPoolClient } from '../ports/IStackingPoolClient';
import { ICachePort } from '../ports/ICachePort';
import { addAbortListener } from 'events';
import { markAsUncloneable } from 'worker_threads';
import { TransactionStatus } from '../../domain/entities/enums';
import { makeGaiaAssociationToken } from '@stacks/wallet-sdk';

export class StackingService {
  constructor(
    private entityManager: EntityManager,
    private transactionClient: ITransactionClient,
    private stackingPoolClient: IStackingPoolClient,
    private cacheClient: ICachePort,
    private transactionClinet: ITransactionClient,
  ) {}

  async saveStackingData(
    userId: number,
    txId: string,
    poolName: string,
  ): Promise<StackingData> {
    const user = await this.entityManager.findOne(User, {
      where: {
        id: userId,
      },
    });
    const parsedTxId = txId.slice(0, 2) !== '0x' ? '0x'.concat(txId) : txId;
    const transactionData: StxTransactionData =
      await this.transactionClient.fetchStackingTransactionData(parsedTxId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }

    if (transactionData.functionName !== 'delegate-stx') {
      throw new WrongStackingFunctionError(
        'Wrong contract call! the right pool stacking contract call should be: delegate-stx',
      );
    }

    const stackingData = new StackingData();
    stackingData.txId = parsedTxId;
    stackingData.startCycleId = transactionData.startCycleId;
    stackingData.endCycleId = transactionData.endCycleId;
    stackingData.poolStxAddress = transactionData.delegateTo;
    stackingData.userStxAddress = transactionData.stacker;
    stackingData.poxAddress = transactionData.poxAddress;
    stackingData.amountOfStxStacked = transactionData.amountUstx / 1000000;
    stackingData.poolName = poolName;
    stackingData.user = user;
    return await this.entityManager.save(stackingData);
  }

  async updateRewardData(
    userId: number,
    startCycleId: number,
    userStxAddress: string,
  ): Promise<void> {
    const stackingData = await this.entityManager.findOne(StackingData, {
      where: {
        user: {
          id: userId,
        },
        startCycleId,
        userStxAddress,
      },
    });

    if (!stackingData) {
      throw new StackingDataNotFoundError(
        `Stacking Data not found for user with id ${userId} and address ${userStxAddress} that started staking on cycle with id ${startCycleId}`,
      );
    }

    const rewardedAmount = await this.stackingPoolClient.delegationTotalRewards(
      userStxAddress,
      startCycleId,
      stackingData.endCycleId,
    );

    await this.entityManager.update(StackingData, stackingData.id, {
      rewardedStxAmount: rewardedAmount,
    });
  }

  private setRewardFolderRef(ref: string) {
    this.cacheClient.set<string>('rewards_ref', ref);
  }

  async rewardRefHasChanged() {
    const cachedRef = await this.cacheClient.get('rewards_ref');
    if (!cachedRef) {
      throw new RewardFolderRefNotCached('Reward folder ref was not saved');
    }

    const gitRef = await this.stackingPoolClient.getRewardFolderRef();
    if (cachedRef !== gitRef) {
      this.setRewardFolderRef(gitRef);
      return false;
    }
    return true;
  }

  async updatePendingStackingDelegations() {
    await this.entityManager.transaction(async (manager) => {
      const delegations = await manager.find(StackingData, {
        where: {
          txStatus: TransactionStatus.Pending,
        },
      });
      for (const delegation of delegations) {
        const currentStatus: string =
          await this.transactionClient.getTransactionStatus(delegation.txId);
        const updatedStatus =
          currentStatus === 'success'
            ? TransactionStatus.Success
            : currentStatus === 'pending'
              ? TransactionStatus.Pending
              : TransactionStatus.Failed;
        delegation.txStatus = updatedStatus;
        await manager.save(delegation);
      }
    });
  }
}
