import { EntityManager } from 'typeorm';
import { ITransactionClient } from '../ports/ITransactionClient';
import { StackingData } from '../../domain/entities/stackingData';
import { StxTransactionData } from '../../shared/types';
import { StackingDataNotFoundError, WrongStackingFunctionError } from '../errors/stackingDataErrors';
import { UserNotFoundError } from '../errors/userErrors';
import { User } from '../../domain/entities/user';
import { IStackingPoolClient } from '../ports/IStackingPoolClient';

export class StackingService {
  constructor(
    private entityManager: EntityManager,
    private transactionClient: ITransactionClient,
    private stackingPoolClient: IStackingPoolClient,
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
  ):Promise<void> {
    const stackingData = await this.entityManager.findOne(StackingData, {
      where: {
        user: {
          id: userId,
        },
        startCycleId,
        userStxAddress,
      }
    });

    if (!stackingData) { 
      throw new StackingDataNotFoundError(`Stacking Data not found for user with id ${userId} and address ${userStxAddress} that started staking on cycle with id ${startCycleId}`);
    }
    
    const rewardedAmount = await this.stackingPoolClient.delegationTotalRewards(userStxAddress, startCycleId, stackingData.endCycleId); 

    await this.entityManager.update(StackingData, stackingData.id, {
      rewardedStxAmount: rewardedAmount,
    });
  }
}
