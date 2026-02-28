import { EntityManager, IsNull, MoreThan, Not } from 'typeorm';
import { User } from '../../domain/entities/user';
import {
  numberOfDailyTransactions,
  numberOfDefiOperations,
  numberOfReferralsUserd,
  numberOfUsers,
} from './metrics';
import { Submission } from '../../domain/entities/submission';
import { logger } from '../../api/helpers/logger';
import { DefiOperation } from '../../domain/entities/defiOperation';

export class MetricsService {
  constructor(private entityManager: EntityManager) {}

  private async updateNumberOfUserMetric() {
    const count = await this.entityManager.count(User);
    numberOfUsers.set(count);
  }

  private async updateNumberOfDailyTransactionsMetric() {
    const count = await this.entityManager.count(Submission, {
      where: {
        transactionId: Not(IsNull()),
        createdAt: MoreThan(
          new Date(new Date().setDate(new Date().getDate() - 1)),
        ),
      },
    });
    numberOfDailyTransactions.set(count);
  }

  private async updateNumberOfDefiOperationsMetric() {
    const count = await this.entityManager.count(DefiOperation, {
      where: {
        txId: Not(IsNull()),
      },
    });
    numberOfDefiOperations.set(count);
  }

  private async updateNumberOfReferralsUsedMetric() {
    const count = await this.entityManager.count(User, {
      where: {
        referrer: Not(IsNull()),
      },
    });
    numberOfReferralsUserd.set(count);
  }
  async refreshMetrics() {
    logger.info('Refreshing metrics');
    await this.updateNumberOfUserMetric();
    await this.updateNumberOfDailyTransactionsMetric();
    await this.updateNumberOfDefiOperationsMetric();
    await this.updateNumberOfReferralsUsedMetric();
    setInterval(
      async () => {
        await this.updateNumberOfUserMetric();
        await this.updateNumberOfDailyTransactionsMetric();
        await this.updateNumberOfDefiOperationsMetric();
        await this.updateNumberOfReferralsUsedMetric();
      },
      1000 * 60,
    ); // 1 Minute
    logger.info('Metrics refreshed');
  }
}
