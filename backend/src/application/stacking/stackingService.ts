import { EntityManager } from 'typeorm';
import { ITransactionClient } from '../ports/ITransactionClient';
import { StackingData } from '../../domain/entities/stackingData';
import { StxTransactionData } from '../../shared/types';
import { WrongStackingFunctionError } from '../errors/stackingDataErrors';
import { UserNotFoundError } from '../errors/userErrors';
import { User } from '../../domain/entities/user';

export class StackingService {
  constructor(
    private entityManager: EntityManager,
    private transactionClient: ITransactionClient,
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
    stackingData.poolAddress = transactionData.delegateTo;
    stackingData.userAddress = transactionData.stacker;
    stackingData.poxAddress = transactionData.poxAddress;
    stackingData.amountOfStxStacked = transactionData.amountUstx / 1000000;
    stackingData.poolName = poolName;
    stackingData.user = user;
    return await this.entityManager.save(stackingData);
  }
}
