import { EntityManager, IsNull, LessThan, Or } from 'typeorm';
import { ITransactionClient } from '../ports/ITransactionClient';
import { StackingData } from '../../domain/entities/stackingData';
import { StxTransactionData } from '../../shared/types';
import {
  RewardFolderRefNotCached,
  WrongStackingFunctionError,
  WrongStackingPoolError,
} from '../errors/stackingDataErrors';
import { UserNotFoundError } from '../errors/userErrors';
import { User } from '../../domain/entities/user';
import { IStackingPoolClient } from '../ports/IStackingPoolClient';
import { ICachePort } from '../ports/ICachePort';
import { TransactionStatus } from '../../domain/entities/enums';
import { FAST_POOL_STX_ADDRESS } from '../../shared/constants';

export class StackingService {
  constructor(
    private entityManager: EntityManager,
    private transactionClient: ITransactionClient,
    private stackingPoolClient: IStackingPoolClient,
    private cacheClient: ICachePort,
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
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
    const parsedTxId = txId.slice(0, 2) !== '0x' ? '0x'.concat(txId) : txId;
    const transactionData: StxTransactionData =
    await this.transactionClient.fetchStackingTransactionData(parsedTxId);
    if (transactionData.functionName !== 'delegate-stx') {
      throw new WrongStackingFunctionError(
        'Wrong contract call! the right pool stacking contract call should be: delegate-stx',
      );
    }
    if (transactionData.delegateTo !== FAST_POOL_STX_ADDRESS) {
      throw new WrongStackingPoolError(
        `Error: Wrong Pool please use fast pool for a better tracking of your stacking data, address: ${FAST_POOL_STX_ADDRESS}`
      )
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

  async updateRewardData(): Promise<void> {
    const BATCH_SIZE = 100;
    let processedCount = 0;
    let hasMore = true;

    while (hasMore) {
      await this.entityManager.transaction(async (manager) => {
        const { cycleId } = await this.transactionClient.fetchPoxCycleData();
        
        const delegations = await manager.find(StackingData, {
          where: {
            endCycleId: Or(IsNull(), LessThan(cycleId as number)),
            txStatus: TransactionStatus.Success,
          },
          take: BATCH_SIZE,
          skip: processedCount,
        });

        if (delegations.length === 0) {
          hasMore = false;
          return;
        }

        for (const delegation of delegations) {
          const rewardedAmount =
            await this.stackingPoolClient.delegationTotalRewards(
              delegation.userStxAddress,
              delegation.startCycleId,
              delegation.endCycleId,
            );
          delegation.rewardedStxAmount = rewardedAmount;
          await manager.save(delegation);
        }

        processedCount += delegations.length;

        // If we got fewer results than batch size, we're done
        if (delegations.length < BATCH_SIZE) {
          hasMore = false;
        }
      });
    }
  }

  private async setRewardFolderRef(ref: string) {
    await this.cacheClient.set<string>('rewards_ref', ref);
  }

  async saveRewardFolderRef() {
    const gitRef = await this.stackingPoolClient.getRewardFolderRef();
    await this.setRewardFolderRef(gitRef);
  }

  async rewardRefHasChanged() {
    const cachedRef = await this.cacheClient.get('rewards_ref');
    if (!cachedRef) {
      throw new RewardFolderRefNotCached('Reward folder ref was not saved');
    }

    const gitRef = await this.stackingPoolClient.getRewardFolderRef();
    if (cachedRef !== gitRef) {
      await this.setRewardFolderRef(gitRef);
      return true;
    }
    return false;
  }

  async updatePendingStackingDelegations() {
    const BATCH_SIZE = 100;
    let processedCount = 0;
    let hasMore = true;

    while (hasMore) {
      await this.entityManager.transaction(async (manager) => {
        const delegations = await manager.find(StackingData, {
          where: {
            txStatus: TransactionStatus.Pending,
          },
          take: BATCH_SIZE,
          skip: processedCount,
        });

        if (delegations.length === 0) {
          hasMore = false;
          return;
        }

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

        processedCount += delegations.length;

        // If we got fewer results than batch size, we're done
        if (delegations.length < BATCH_SIZE) {
          hasMore = false;
        }
      });
    }
  }
}
