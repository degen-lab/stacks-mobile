import { EntityManager, In, LessThan } from 'typeorm';
import { createVerify } from 'crypto';
import { TransactionClientPort } from '../ports/transactionClientPort';
import { UserBlackListedError, UserNotFoundError } from '../errors/userErrors';
import { User } from '../../domain/entities/user';
import { SubmissionDomainService } from '../../domain/service/submissionDomainService';
import {
  SubmissionType,
  TournamentStatusEnum,
  TransactionStatus,
} from '../../domain/entities/enums';
import { logger } from '../../api/helpers/logger';
import { Submission } from '../../domain/entities/submission';
import {
  AdAlreadyWatchedError,
  AdNotWatchedError,
  CannotDeleteSubmittedTransactionError,
  InvalidAdMobSignatureError,
  SubmissionNotFoundError,
  SubmissionPhaseFinishedError,
  TransactionAlreadySubmittedError,
  TransactionNotFoundError,
  TransactionNotSponsoredError,
} from '../errors/transactionErrors';
import { TournamentStatusNotFoundError } from '../errors/rewardsErrors';
import { TournamentStatus } from '../../domain/entities/tournamentStatus';
import { NODE_ENV } from '../../shared/constants';
import { TxBroadcastResult } from '@stacks/transactions';

export class TransactionService {
  constructor(
    private transactionClient: TransactionClientPort,
    private submissionDomainService: SubmissionDomainService,
    private entityManager: EntityManager,
  ) {}

  async createUnsignedTransaction(
    userId: number,
    address: string,
    publicKey: string,
    score: number,
    submissionType: SubmissionType,
    isSponsored: boolean,
  ): Promise<{ serializedTx: string; submission: Submission }> {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['fraudAttempts', 'submissions'],
    });
    if (!user) {
      throw new UserNotFoundError(
        `Invalid id, user with id ${userId} not found`,
      );
    }
    user.updateBlacklistStatus();
    if (user.isBlackListed) {
      throw new UserBlackListedError();
    }
    if (isSponsored) {
      if (submissionType === SubmissionType.Raffle) {
        user.canSubmitSponsoredRaffleSubmission();
      } else if (submissionType === SubmissionType.WeeklyContest) {
        user.canSubmitSponsoredWeeklyContestSubmission();
      }
    }
    const tournamentId = await this.transactionClient.getTournamentId();
    const submission = this.submissionDomainService.createSubmission(
      address,
      score,
      tournamentId,
      submissionType,
      user,
      isSponsored,
    );
    const savedSubmission = await this.entityManager.save(submission);
    return {
      serializedTx:
        await this.transactionClient.createTournamentUnsignedTransaction(
          address,
          publicKey,
          score,
          isSponsored,
        ),
      submission: savedSubmission,
    };
  }

  async submitContestScore(
    userId: number,
    submissionId: number,
    serializedTx: string,
  ): Promise<string> {
    const maxRetries = 60; // Maximum 60 retries (60 seconds)
    const retryDelay = 1000; // 1 second between retries
    let retryCount = 0;

    // First, try to clear pending transactions outside the transaction
    // to avoid holding the transaction open for too long
    while (retryCount < maxRetries) {
      const pendingCount = await this.checkDbPendingTransactionsCount();
      if (pendingCount <= 25) {
        break;
      }

      // Clear pending transactions (this makes external API calls)
      await this.clearPendingTransactionsOutsideTransaction();

      logger.info({
        msg: 'Waiting for pending transactions to be cleared',
        pendingCount,
        retryCount,
        maxRetries,
      });

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retryCount++;
    }

    if (retryCount >= maxRetries) {
      throw new Error(
        `Timeout waiting for pending transactions to clear. There are still more than 25 pending transactions after ${maxRetries} retries.`,
      );
    }

    return await this.entityManager.transaction(async (manager) => {
      logger.info({
        msg: 'Starting submitContestScore',
        submissionId,
        serializedTxLength: serializedTx.length,
      });

      const submission = await manager.findOne(Submission, {
        where: { id: submissionId, user: { id: userId } },
      });
      if (!submission) {
        throw new TransactionNotFoundError(
          `Invalid id, submission with id ${submissionId} not found`,
        );
      }
      if (submission.transactionStatus !== TransactionStatus.NotBroadcasted) {
        throw new TransactionAlreadySubmittedError(
          `Transaction already submitted for submission with id ${submissionId}`,
        );
      }

      const txId =
        await this.transactionClient.broadcastSponsoredTransaction(
          serializedTx,
        );
      submission.transactionId = txId;
      submission.transactionStatus = TransactionStatus.Pending;
      await manager.save(submission);

      logger.info({
        msg: 'Transaction submitted successfully',
        submissionId,
        txId: submission.transactionId,
      });

      return txId;
    });
  }

  /**
   * Check the count of pending transactions in the database
   * Returns the count (not inside a transaction)
   */
  private async checkDbPendingTransactionsCount(): Promise<number> {
    const pendingSubmissions = await this.entityManager.find(Submission, {
      where: { transactionStatus: TransactionStatus.Pending },
    });
    return pendingSubmissions.length;
  }

  /**
   * Clear pending transactions by checking their blockchain status
   * This method makes external API calls, so it should be called outside a transaction
   */
  private async clearPendingTransactionsOutsideTransaction(): Promise<void> {
    const submissions = await this.entityManager.find(Submission, {
      where: { transactionStatus: TransactionStatus.Pending },
    });

    for (const submission of submissions) {
      if (!submission.transactionId) {
        logger.warn({
          msg: 'Submission has no transaction id',
          submissionId: submission.id,
        });
        // Update outside transaction to avoid holding it open
        await this.entityManager.update(
          Submission,
          { id: submission.id },
          { transactionStatus: TransactionStatus.NotBroadcasted },
        );
        continue;
      }

      try {
        const txStatus = await this.transactionClient.getTransactionStatus(
          submission.transactionId,
        );

        let newStatus: TransactionStatus;
        if (txStatus === 'success') {
          newStatus = TransactionStatus.Success;
        } else if (txStatus === 'pending') {
          newStatus = TransactionStatus.Pending;
        } else {
          newStatus = TransactionStatus.Failed;
        }

        // Update outside transaction to avoid holding it open
        await this.entityManager.update(
          Submission,
          { id: submission.id },
          { transactionStatus: newStatus },
        );

        logger.info({
          msg: 'Updated submission transaction status',
          submissionId: submission.id,
          txId: submission.transactionId,
          oldStatus: TransactionStatus.Pending,
          newStatus,
        });
      } catch (error) {
        logger.error({
          msg: 'Error checking transaction status for submission',
          submissionId: submission.id,
          txId: submission.transactionId,
          error,
        });
        // On error, leave it as Pending - will be checked again next time
      }
    }
  }

  async processSubmissionTransaction(
    userId: number,
    submissionId: number,
    serializedTx: string,
  ): Promise<Submission> {
    const tournamentId = await this.transactionClient.getTournamentId();
    let tournamentStatus = await this.entityManager.find(TournamentStatus, {
      where: {
        tournamentId,
      },
    });
    if (tournamentStatus.length === 0) {
      // Auto-initialize tournament status if it doesn't exist
      logger.info({
        msg: 'Tournament status not found, initializing...',
        tournamentId,
      });
      await this.createTournamentStatus(tournamentId);
      tournamentStatus = await this.entityManager.find(TournamentStatus, {
        where: {
          tournamentId,
        },
      });
      if (tournamentStatus.length === 0) {
        throw new TournamentStatusNotFoundError(
          'Failed to initialize tournament status',
        );
      }
    }
    const courentTournamentStatus = tournamentStatus[0];
    if (courentTournamentStatus.status !== TournamentStatusEnum.SubmitPhase) {
      throw new SubmissionPhaseFinishedError(
        'Tournament is not in submit phase',
      );
    }
    const submission = await this.entityManager.findOne(Submission, {
      where: { id: submissionId, user: { id: userId } },
    });

    const userSubmissions = await this.entityManager.find(Submission, {
      where: {
        user: { id: userId },
        transactionStatus: In([
          TransactionStatus.Processing,
          TransactionStatus.Pending,
        ]),
      },
    });
    if (userSubmissions.length > 0) {
      throw new TransactionAlreadySubmittedError(
        `Can't have more than one pending submission`,
      );
    }
    if (!submission) {
      throw new TransactionNotFoundError(
        `Invalid id, submission with id ${submissionId} not found`,
      );
    }
    if (submission.transactionStatus !== TransactionStatus.NotBroadcasted) {
      throw new TransactionAlreadySubmittedError(
        `Transaction already submitted for submission with id ${submissionId}`,
      );
    }

    if (NODE_ENV === 'production' && !submission.adWatched) {
      throw new AdNotWatchedError(
        `Ad not watched for submission with id ${submissionId}`,
      );
    }

    if (!submission.isSponsored) {
      throw new TransactionNotSponsoredError(
        `Transaction with id ${submissionId} should be sponsored in order to be processed `,
      );
    }
    submission.transactionStatus = TransactionStatus.Processing;
    submission.serializedTx = serializedTx;
    const savedSubmission = await this.entityManager.save(submission);
    return savedSubmission;
  }

  async broadcastBatchTransactions(): Promise<void> {
    logger.info({
      msg: 'Broadcasting batch transactions',
    });

    logger.info({
      msg: 'Step 1: Clearing pending transactions',
    });
    await this.clearPendingTransactionsOutsideTransaction();
    logger.info({
      msg: 'Pending transactions cleared',
    });
    let pendingCount = await this.checkDbPendingTransactionsCount();
    logger.info({
      msg: 'Step 2: Checking pending transactions',
      pendingCount,
    });
    while (pendingCount > 0) {
      logger.info({
        msg: 'Waiting for the last batch of transactions to be anchored',
        pendingCount,
      });
      await this.clearPendingTransactionsOutsideTransaction();
      pendingCount = await this.checkDbPendingTransactionsCount();
      logger.info({
        msg: 'Sleeping for 10 seconds',
      });
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
    logger.info({
      msg: 'Step 3: Broadcasting transactions',
    });
    const submissions = await this.entityManager.find(Submission, {
      where: { transactionStatus: TransactionStatus.Processing },
      take: 25,
      order: {
        createdAt: 'ASC',
      },
    });
    logger.info({
      msg: 'Broadcasting transactions',
      submissionsCount: submissions.length,
    });
    for (const submission of submissions) {
      if (!submission.serializedTx) {
        logger.warn({
          msg: 'Submission has no serialized tx',
          submissionId: submission.id,
        });
        submission.transactionStatus = TransactionStatus.NotBroadcasted;
      } else {
        const txId = await this.transactionClient.broadcastSponsoredTransaction(
          submission.serializedTx,
        );
        submission.transactionId = txId;
        submission.transactionStatus = TransactionStatus.Pending;
        await this.entityManager.save(submission);
      }
    }
  }

  async validateSsv(
    userId: number,
    submissionIdRaw: string | undefined,
    keyId: string,
    signature: string,
    rawQueryString: string,
  ): Promise<void> {
    const submissionId = submissionIdRaw ? Number(submissionIdRaw) : Number.NaN;
    if (Number.isNaN(submissionId)) {
      throw new SubmissionNotFoundError('Invalid submission id');
    }
    const submission = await this.entityManager.findOne(Submission, {
      where: { id: submissionId, user: { id: userId } },
    });
    if (!submission) {
      throw new SubmissionNotFoundError(
        `Invalid id, submission with id ${submissionId} not found`,
      );
    }
    if (submission.adWatched) {
      throw new AdAlreadyWatchedError(
        `Ad already watched for submission with id ${submissionId}`,
      );
    }
    if (submission.transactionStatus !== TransactionStatus.NotBroadcasted) {
      throw new TransactionAlreadySubmittedError(
        `Transaction already submitted for submission with id ${submissionId}`,
      );
    }

    const signedPayload = this.buildSignedPayload(rawQueryString);
    const publicKey = await this.fetchAdMobPublicKey(keyId);
    const isValidSignature = this.verifyAdMobSignature(
      publicKey,
      signedPayload,
      signature,
    );
    if (!isValidSignature) {
      throw new InvalidAdMobSignatureError('Invalid AdMob SSV signature');
    }

    submission.adWatched = true;
    await this.entityManager.save(submission);
  }

  private buildSignedPayload(querystring: string): string {
    if (!querystring) {
      return '';
    }
    // Remove the signature parameter; AdMob sends params already sorted.
    return querystring
      .split('&')
      .filter((param) => !param.startsWith('signature='))
      .join('&');
  }

  private async fetchAdMobPublicKey(keyId: string): Promise<string> {
    const response = await fetch(
      'https://www.gstatic.com/admob/reward/verifier-keys.json',
    );
    if (!response.ok) {
      throw new InvalidAdMobSignatureError('Failed to fetch AdMob public keys');
    }
    const data = (await response.json()) as {
      keys?: Array<{ keyId: string; base64: string }>;
    };
    const keyEntry = data.keys?.find((key) => key.keyId === keyId);
    if (!keyEntry?.base64) {
      throw new InvalidAdMobSignatureError('AdMob public key not found');
    }
    return `-----BEGIN PUBLIC KEY-----\n${keyEntry.base64}\n-----END PUBLIC KEY-----`;
  }

  private verifyAdMobSignature(
    publicKey: string,
    message: string,
    signature: string,
  ): boolean {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(message);
    verifier.end();
    return verifier.verify(
      publicKey,
      this.normalizeBase64(signature),
      'base64',
    );
  }

  private normalizeBase64(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    return normalized + padding;
  }

  /**
   * Create tournament status if it doesn't exist
   */
  private async createTournamentStatus(tournamentId: number): Promise<void> {
    const tournamentStatus = new TournamentStatus();
    tournamentStatus.resetTournament(tournamentId);
    await this.entityManager.save(tournamentStatus);
    logger.info({
      msg: 'Tournament status initialized',
      tournamentId,
    });
  }

  async submitNormalTransaction(
    userId: number,
    submissionId: number,
    serializedTx: string,
  ): Promise<TxBroadcastResult> {
    const submission = await this.entityManager.findOne(Submission, {
      where: { id: submissionId, user: { id: userId } },
    });
    if (!submission) {
      throw new TransactionNotFoundError(
        `Invalid id, submission with id ${submissionId} not found`,
      );
    }
    if (submission.transactionStatus !== TransactionStatus.NotBroadcasted) {
      throw new TransactionAlreadySubmittedError(
        `Transaction already submitted for submission with id ${submissionId}`,
      );
    }
    const result =
      await this.transactionClient.broadcastTransaction(serializedTx);
    submission.transactionId = result.txid;
    submission.transactionStatus = TransactionStatus.Success;
    await this.entityManager.save(submission);
    return result;
  }

  async deleteSubmission(userId: number, submissionId: number): Promise<void> {
    const submission = await this.entityManager.findOne(Submission, {
      where: {
        id: submissionId,
        user: { id: userId },
      },
    });
    if (!submission) {
      throw new SubmissionNotFoundError(
        `Invalid id, submission with id ${submissionId} not found`,
      );
    }

    if (
      submission.transactionStatus !== TransactionStatus.NotBroadcasted &&
      submission.transactionStatus !== TransactionStatus.Failed
    ) {
      throw new CannotDeleteSubmittedTransactionError(
        `Cannot delete submitted transaction for submission with id ${submissionId}`,
      );
    }
    await this.entityManager.remove(submission);
  }

  async cleanUpUnsuccessfullSubmissions(): Promise<void> {
    const tournamentId = await this.transactionClient.getTournamentId();
    const submissions = await this.entityManager.delete(Submission, {
      where: {
        tournamentId,
        transactionStatus: TransactionStatus.Failed,
      },
    });
    logger.info({
      msg: 'Deleted failed submissions',
      tournamentId,
      deletedCount: submissions.affected || 0,
    });
    const deleteResult = await this.entityManager.delete(Submission, {
      where: {
        tournamentId,
        transactionStatus: TransactionStatus.NotBroadcasted,
        createdAt: LessThan(new Date(Date.now() - 1000 * 60 * 60 * 24)),
      },
    });
    logger.info({
      msg: 'Deleted not broadcasted submissions',
      tournamentId,
      deletedCount: deleteResult.affected || 0,
    });
  }
}
