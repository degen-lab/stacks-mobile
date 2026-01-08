import { EntityManager, In } from 'typeorm';
import { RewardsCalculator } from '../../domain/service/rewardsCalculator';
import { Submission } from '../../domain/entities/submission';
import { ITransactionClient } from '../ports/ITransactionClient';
import { BRONZE_TIER_BONUS, SILVER_TIER_BONUS } from '../../shared/constants';
import { SubmissionTier } from '../../domain/helpers/types';
import { RewardsDistributionData } from '../../domain/entities/rewardsDistributionData';
import { SubmissionType, TransactionStatus } from '../../domain/entities/enums';
import { logger } from '../../api/helpers/logger';
import { TournamentStatus } from '../../domain/entities/tournamentStatus';
import { TournamentStatusNotFoundError } from '../errors/rewardsError';

export class RewardsService {
  constructor(
    private rewardsCalculator: RewardsCalculator,
    private transactionClient: ITransactionClient,
    private entityManager: EntityManager,
  ) {}

  async distributeRewards() {
    await this.entityManager.transaction(async (manager) => {
      const tournamentId = await this.transactionClient.getTournamentId();

      // Get the best submission (highest score) for each user in this tournament
      // Using DISTINCT ON (PostgreSQL specific) to get exactly one submission per user
      // with the highest score. If multiple submissions have the same max score,
      // it will pick one (ordered by score DESC, then by id)
      // Get the actual column name from TypeORM metadata
      const submissionMetadata = manager.connection.getMetadata(Submission);
      const userColumn = submissionMetadata.findColumnWithPropertyName('user');
      const userIdColumnName = userColumn?.databaseName || 'userId';

      const submissions: Submission[] = await manager.query(
        `
        SELECT DISTINCT ON (s."${userIdColumnName}") s.*
        FROM submission s
        WHERE s."tournamentId" = $1 AND s."type" = $2 AND s."transactionStatus" = $3
        ORDER BY s."${userIdColumnName}", s.score DESC, s.id DESC
        `,
        [tournamentId, SubmissionType.WeeklyContest, TransactionStatus.Success],
      );

      // Load full entities with relations
      const submissionIds = submissions.map((row) => row.id);
      if (submissionIds.length === 0) {
        logger.info(`No submissions found for tournament id: ${tournamentId}`);
        return;
      }
      const submissionEntities: Submission[] = await manager
        .createQueryBuilder(Submission, 'submission')
        .where('submission.id IN (:...ids)', { ids: submissionIds })
        .andWhere('submission.type = :type', {
          type: SubmissionType.WeeklyContest,
        })
        .andWhere('submission.transactionStatus = :status', {
          status: TransactionStatus.Success,
        })
        .leftJoinAndSelect('submission.user', 'user')
        .getMany();
      logger.info({
        msg: 'Starting rewards distribution calculation',
        tournamentId,
        totalSuccessfulSubmissions: submissionEntities.length,
        sampleScores: submissionEntities
          .slice(0, 10)
          .map((s) => ({ id: s.id, score: s.score, address: s.stacksAddress })),
      });

      // Early return if no valid submissions after filtering
      if (submissionEntities.length === 0) {
        logger.info({
          msg: 'No valid submissions found after filtering, skipping rewards distribution',
          tournamentId,
        });
        return;
      }

      const { gold, silver, bronze } =
        this.rewardsCalculator.computeThreshold(submissionEntities);

      logger.info({
        msg: 'Rewards distribution calculation completed',
        tournamentId,
        totalSubmissions: submissionEntities.length,
        goldCount: gold.length,
        silverCount: silver.length,
        bronzeCount: bronze.length,
        totalRewarded: gold.length + silver.length + bronze.length,
        goldAddresses: gold.map((s) => s.stacksAddress),
        silverAddresses: silver.map((s) => s.stacksAddress),
        bronzeAddresses: bronze.map((s) => s.stacksAddress),
      });
      // Process silver tier: award points and save both submission and user
      for (const submission of silver) {
        submission.user.incrementPoints(SILVER_TIER_BONUS);
        submission.tier = SubmissionTier.Silver;
        await manager.save(submission);
        await manager.save(submission.user);
      }

      // Process bronze tier: award points and save both submission and user
      for (const submission of bronze) {
        submission.user.incrementPoints(BRONZE_TIER_BONUS);
        submission.tier = SubmissionTier.Bronze;
        await manager.save(submission);
        await manager.save(submission.user);
      }

      // Process gold tier: set tier, collect addresses, and save submission
      let addresses: string[] = [];
      for (const submission of gold) {
        submission.tier = SubmissionTier.Gold;
        addresses.push(submission.stacksAddress);
        await manager.save(submission);
      }
      logger.info({
        msg: 'Distributing rewards to addresses',
        length: addresses.length,
        addresses,
        tournamentId,
      });
      const transactionId =
        await this.transactionClient.distributeRewards(addresses);
      const rewardsDistributionData: RewardsDistributionData =
        new RewardsDistributionData();
      logger.info(
        `reward distributed for tournament id: ${tournamentId}, txId: ${transactionId}`,
      );
      rewardsDistributionData.tournamentId = tournamentId;
      rewardsDistributionData.transactionId = transactionId;
      rewardsDistributionData.rewardedSubmissions = [
        ...gold,
        ...silver,
        ...bronze,
      ];
      await manager.save(rewardsDistributionData);
    });
  }

  /**
   * Extract up to `count` raffle winners for the current tournament.
   * Simple random sampling (no weighting); if fewer entries than count, return all.
   */
  async extractRaffleWinners(count = 3): Promise<Submission[]> {
    return await this.entityManager.transaction(async (manager) => {
      const tournamentId = await this.transactionClient.getTournamentId();

      const raffleSubmissions = await manager.find(Submission, {
        where: {
          tournamentId,
          type: SubmissionType.Raffle,
          transactionStatus: TransactionStatus.Success,
        },
        relations: ['user'],
      });

      if (!raffleSubmissions.length) {
        logger.info({
          msg: 'No raffle submissions found for current tournament',
          tournamentId,
        });
        return [];
      }

      // Shuffle, enforce unique users, and take up to count
      const shuffled = raffleSubmissions
        .map((s) => ({ s, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(({ s }) => s);

      const seenUsers = new Set<number>();
      const winners: Submission[] = [];
      for (const sub of shuffled) {
        const userId = sub.user?.id;
        if (!userId) {
          continue;
        }
        if (seenUsers.has(userId)) {
          continue;
        }
        seenUsers.add(userId);
        winners.push(sub);
        if (winners.length >= count) {
          break;
        }
      }

      logger.info({
        msg: 'Raffle winners selected',
        tournamentId,
        count: winners.length,
        winners: winners.map((s) => ({
          submissionId: s.id,
          userId: s.user.id,
          address: s.stacksAddress,
        })),
      });
      return winners;
    });
  }

  /**
   * Distribute rewards to raffle winners (same payout path as gold tier).
   */
  async distributeRaffleRewards(count = 3): Promise<string | null> {
    const winners = await this.extractRaffleWinners(count);
    if (!winners.length) {
      return null;
    }

    const addresses = winners.map((w) => w.stacksAddress);
    logger.info({
      msg: 'Distributing raffle rewards',
      tournamentId: await this.transactionClient.getTournamentId(),
      winners: winners.map((w) => ({
        submissionId: w.id,
        userId: w.user.id,
        address: w.stacksAddress,
      })),
    });

    const transactionId =
      await this.transactionClient.distributeRewards(addresses);

    const rewardsDistributionData = new RewardsDistributionData();
    rewardsDistributionData.tournamentId =
      await this.transactionClient.getTournamentId();
    rewardsDistributionData.transactionId = transactionId;
    rewardsDistributionData.rewardedSubmissions.push(...winners);
    await this.entityManager.save(rewardsDistributionData);

    return transactionId;
  }

  async headToNextTournament(): Promise<string> {
    const txId = await this.transactionClient.headToNextTournament();
    logger.info({
      msg: 'Heading to Next Tournament',
      txId,
    });
    return txId;
  }

  async waitForHeadToNextTournamentAnchored(
    transactionId: string,
    maxWaitTimeMs: number = 300000, // 5 minutes default
    pollIntervalMs: number = 10000, // 10 seconds default
  ): Promise<boolean> {
    const startTime = Date.now();
    let lastStatus: string | null = null;

    while (Date.now() - startTime < maxWaitTimeMs) {
      try {
        const status =
          await this.transactionClient.getTransactionStatus(transactionId);

        if (status === 'success') {
          logger.info({
            msg: 'Head to next tournament transaction anchored',
            transactionId,
          });
          return true;
        }

        // Check if transaction failed (not pending)
        if (
          status === 'abort_by_response' ||
          status === 'abort_by_post_condition' ||
          status === 'dropped_replace_by_fee' ||
          status === 'dropped_replace_across_fork' ||
          status === 'dropped_stale_garbage_collect'
        ) {
          logger.error({
            msg: 'Head to next tournament transaction failed',
            transactionId,
            status,
          });
          return false; // Transaction failed, no need to wait further
        }

        // Only log if status changed
        if (status !== lastStatus) {
          logger.info({
            msg: 'Waiting for head to next tournament transaction to anchor',
            transactionId,
            status,
          });
          lastStatus = status;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      } catch (error) {
        // If 404, transaction might not be indexed yet - continue waiting
        if (
          error instanceof Error &&
          (error.message.includes('404') || error.message.includes('Not Found'))
        ) {
          if (lastStatus !== 'not_found') {
            logger.info({
              msg: 'Transaction not yet indexed, continuing to wait',
              transactionId,
            });
            lastStatus = 'not_found';
          }
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
          continue;
        }

        logger.error({
          msg: 'Error checking head to next tournament transaction status',
          transactionId,
          error,
        });
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }

    logger.warn({
      msg: 'Timeout waiting for head to next tournament transaction to anchor',
      transactionId,
      maxWaitTimeMs,
      lastStatus,
    });
    return false;
  }

  async getLeaderboard(userId: number): Promise<{
    gold: Submission[];
    silver: Submission[];
    bronze: Submission[];
    top: Submission[];
    userPosition: number | null;
    userSubmission: Submission | null;
  }> {
    const tournamentId = await this.transactionClient.getTournamentId();
    // Get the best submission (highest score) for each user in this tournament
    // Using the same logic as distributeRewards
    const submissionMetadata =
      this.entityManager.connection.getMetadata(Submission);
    const userColumn = submissionMetadata.findColumnWithPropertyName('user');
    const userIdColumnName = userColumn?.databaseName || 'userId';

    const submissions: Submission[] = await this.entityManager.query(
      `
      SELECT DISTINCT ON (s."${userIdColumnName}") s.*
      FROM submission s
      WHERE s."tournamentId" = $1 AND s."type" = $2 AND s."transactionStatus" <> $3
      ORDER BY s."${userIdColumnName}", s.score DESC, s.id DESC
      `,
      [tournamentId, SubmissionType.WeeklyContest, TransactionStatus.Failed],
    );

    // Load full entities with relations
    const submissionIds = submissions.map((row) => row.id);
    if (submissionIds.length === 0) {
      return {
        gold: [],
        silver: [],
        bronze: [],
        top: [],
        userPosition: null,
        userSubmission: null,
      };
    }

    const submissionEntities: Submission[] = await this.entityManager
      .createQueryBuilder(Submission, 'submission')
      .where('submission.id IN (:...ids)', { ids: submissionIds })
      .andWhere('submission.type = :type', {
        type: SubmissionType.WeeklyContest,
      })
      .andWhere('submission.transactionStatus <> :status', {
        status: TransactionStatus.Failed,
      })
      .leftJoinAndSelect('submission.user', 'user')
      .getMany();

    // Sort by score descending to get leaderboard order
    submissionEntities.sort((a, b) => b.score - a.score);

    // Handle empty submissions after filtering
    if (submissionEntities.length === 0) {
      return {
        gold: [],
        silver: [],
        bronze: [],
        top: [],
        userPosition: null,
        userSubmission: null,
      };
    }

    // Compute tiers using RewardsCalculator
    const { gold, silver, bronze } = this.rewardsCalculator.computeThreshold([
      ...submissionEntities,
    ]);

    // Find user's submission and position
    const userSubmission =
      submissionEntities.find((submission) => submission.user.id === userId) ||
      null;

    // Calculate user's position (1-based index in sorted leaderboard)
    const userPosition = userSubmission
      ? submissionEntities.findIndex(
          (submission) => submission.id === userSubmission.id,
        ) + 1
      : null;

    const topSubmissions = submissionEntities.slice(0, 10);

    return {
      gold,
      silver,
      bronze,
      top: topSubmissions, // Top 10 successful submissions sorted by score
      userPosition,
      userSubmission,
    };
  }

  async getPreviousTournament(tournamentId: number): Promise<{
    gold: Submission[];
    silver: Submission[];
    bronze: Submission[];
  } | null> {
    // Find the rewards distribution data for the given tournament
    // There should be one RewardsDistributionData per tournament
    const previousTournamentData = await this.entityManager.findOne(
      RewardsDistributionData,
      {
        where: {
          tournamentId,
        },
        relations: ['rewardedSubmissions', 'rewardedSubmissions.user'],
      },
    );

    // If no data found for this tournament, return null
    if (
      !previousTournamentData ||
      !previousTournamentData.rewardedSubmissions
    ) {
      return null;
    }

    // Organize submissions by tier (they should already have tier set from distributeRewards)
    const gold = previousTournamentData.rewardedSubmissions.filter(
      (submission) => submission.tier === SubmissionTier.Gold,
    );
    const silver = previousTournamentData.rewardedSubmissions.filter(
      (submission) => submission.tier === SubmissionTier.Silver,
    );
    const bronze = previousTournamentData.rewardedSubmissions.filter(
      (submission) => submission.tier === SubmissionTier.Bronze,
    );

    // Sort each tier by score descending for consistent ordering
    gold.sort((a, b) => b.score - a.score);
    silver.sort((a, b) => b.score - a.score);
    bronze.sort((a, b) => b.score - a.score);

    return {
      gold,
      silver,
      bronze,
    };
  }

  async createTournamentStatus(): Promise<void> {
    const tournamentStatus = new TournamentStatus();
    const tournamentId = await this.transactionClient.getTournamentId();
    tournamentStatus.resetTournament(tournamentId);
    await this.entityManager.save(tournamentStatus);
  }

  async resetTournamentStatusToSubmitPhase(): Promise<void> {
    const tournamentStatus = await this.entityManager.find(TournamentStatus);

    if (tournamentStatus.length === 0) {
      // Create new if doesn't exist
      await this.createTournamentStatus();
      return;
    }

    const currentTournamentStatus = tournamentStatus[0];
    const oldTournamentId = currentTournamentStatus.tournamentId;
    const newTournamentId = await this.transactionClient.getTournamentId();

    logger.info({
      msg: 'Resetting tournament status with new tournament ID',
      oldTournamentId,
      newTournamentId,
    });

    currentTournamentStatus.resetTournament(newTournamentId);
    await this.entityManager.save(currentTournamentStatus);
  }
  async advanceTournamentPhase(): Promise<void> {
    const tournamentStatus = await this.entityManager.find(TournamentStatus);

    if (tournamentStatus.length === 0) {
      throw new TournamentStatusNotFoundError('Tournament status not found');
    }
    const courentTournamentStatus = tournamentStatus[0];
    courentTournamentStatus.advancePhase();
    await this.entityManager.save(tournamentStatus);
  }

  async getCurrentTournamentStatus(): Promise<TournamentStatus | null> {
    const tournamentStatus = await this.entityManager.find(TournamentStatus);
    return tournamentStatus.length > 0 ? tournamentStatus[0] : null;
  }

  async getBlockchainTournamentId(): Promise<number> {
    return await this.transactionClient.getTournamentId();
  }

  async checkPendingSubmissionsCount(tournamentId?: number): Promise<number> {
    const targetTournamentId =
      tournamentId || (await this.transactionClient.getTournamentId());
    const count = await this.entityManager.count(Submission, {
      where: {
        tournamentId: targetTournamentId,
        type: SubmissionType.WeeklyContest,
        transactionStatus: In([
          TransactionStatus.Processing,
          TransactionStatus.Pending,
        ]),
      },
    });
    return count;
  }

  async checkSuccessfulSubmissionsCount(
    tournamentId?: number,
  ): Promise<number> {
    const targetTournamentId =
      tournamentId || (await this.transactionClient.getTournamentId());
    const count = await this.entityManager.count(Submission, {
      where: {
        tournamentId: targetTournamentId,
        type: SubmissionType.WeeklyContest,
        transactionStatus: TransactionStatus.Success,
      },
    });
    return count;
  }

  async waitForDistributeRewardsAnchored(
    transactionId: string,
    maxWaitTimeMs: number = 300000, // 5 minutes default
    pollIntervalMs: number = 10000, // 10 seconds default
  ): Promise<boolean> {
    const startTime = Date.now();
    let lastStatus: string | null = null;

    while (Date.now() - startTime < maxWaitTimeMs) {
      try {
        const status =
          await this.transactionClient.getTransactionStatus(transactionId);

        if (status === 'success') {
          logger.info({
            msg: 'Distribute rewards transaction anchored',
            transactionId,
          });
          return true;
        }

        // Check if transaction failed (not pending)
        if (
          status === 'abort_by_response' ||
          status === 'abort_by_post_condition' ||
          status === 'abort_by_response' ||
          status === 'dropped_replace_by_fee' ||
          status === 'dropped_replace_across_fork' ||
          status === 'dropped_stale_garbage_collect'
        ) {
          logger.error({
            msg: 'Distribute rewards transaction failed',
            transactionId,
            status,
          });
          return false;
        }

        // Only log if status changed
        if (status !== lastStatus) {
          logger.info({
            msg: 'Waiting for distribute rewards transaction to anchor',
            transactionId,
            status,
          });
          lastStatus = status;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      } catch (error) {
        // If 404, transaction might not be indexed yet - continue waiting
        if (error instanceof Error && error.message.includes('404')) {
          // Only log 404 once
          if (lastStatus !== '404') {
            logger.debug({
              msg: 'Transaction not yet indexed, continuing to wait',
              transactionId,
            });
            lastStatus = '404';
          }
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
          continue;
        }

        logger.error({
          msg: 'Error checking distribute rewards transaction status',
          transactionId,
          error,
        });
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }

    logger.warn({
      msg: 'Timeout waiting for distribute rewards transaction to anchor',
      transactionId,
      maxWaitTimeMs,
      lastStatus,
    });
    return false;
  }

  async getLastDistributeRewardsTransactionId(
    tournamentId?: number,
  ): Promise<string | null> {
    const targetTournamentId =
      tournamentId || (await this.transactionClient.getTournamentId());
    const rewardsData = await this.entityManager.findOne(
      RewardsDistributionData,
      {
        where: { tournamentId: targetTournamentId },
        order: { id: 'DESC' },
      },
    );
    return rewardsData?.transactionId || null;
  }

  async isRewardsDistributionCompleted(
    tournamentId?: number,
  ): Promise<boolean> {
    const targetTournamentId =
      tournamentId || (await this.transactionClient.getTournamentId());
    const rewardsData = await this.entityManager.findOne(
      RewardsDistributionData,
      {
        where: { tournamentId: targetTournamentId },
        order: { id: 'DESC' },
      },
    );

    if (!rewardsData || !rewardsData.transactionId) {
      return false;
    }

    // Check if the transaction was successfully anchored
    const status = await this.transactionClient.getTransactionStatus(
      rewardsData.transactionId,
    );
    return status === 'success';
  }

  async cleanupUnsuccessfulSubmissions(tournamentId: number): Promise<void> {
    const deletedCount = await this.entityManager.delete(Submission, {
      tournamentId,
      type: SubmissionType.WeeklyContest,
      transactionStatus: In([
        TransactionStatus.NotBroadcasted,
        TransactionStatus.Processing,
        TransactionStatus.Pending,
        TransactionStatus.Failed,
      ]),
    });
    logger.info({
      msg: 'Cleaned up unsuccessful submissions',
      tournamentId,
      deletedCount: deletedCount.affected || 0,
    });
  }

  async deleteRewardsDistributionData(transactionId: string): Promise<void> {
    const rewardsData = await this.entityManager.findOne(
      RewardsDistributionData,
      {
        where: { transactionId },
      },
    );
    if (rewardsData) {
      await this.entityManager.remove(rewardsData);
      logger.info({
        msg: 'Removed failed rewards distribution data',
        transactionId,
      });
    }
  }

  async getTournamentData(): Promise<TournamentStatus | null> {
    const tournamentStatus = await this.entityManager.find(TournamentStatus);
    return tournamentStatus.length > 0 ? tournamentStatus[0] : null;
  }
}
