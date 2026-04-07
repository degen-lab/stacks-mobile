import { EntityManager, In, LessThan } from 'typeorm';
import { TxBroadcastResult } from '@stacks/transactions';
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
  CannotDeleteSubmittedTransactionError,
  SubmissionNotFoundError,
  SubmissionPhaseFinishedError,
  TransactionAlreadySubmittedError,
  TransactionNotFoundError,
  TransactionNotSponsoredError,
} from '../errors/transactionErrors';
import {
  SponsoredTransactionExpiredError,
  SponsoredTransactionForbiddenError,
  SponsoredTransactionNotFoundError,
  UnsupportedSponsoredTransactionError,
} from '../errors/sponsoredTransactionErrors';
import { TournamentStatusNotFoundError } from '../errors/rewardsErrors';
import { TournamentStatus } from '../../domain/entities/tournamentStatus';
import { NODE_ENV } from '../../shared/constants';
import { DefiOperation } from '../../domain/entities/defiOperation';
import { DefiOperationNotFoundError } from '../errors/defiErrors';
import { SponsoredTransaction } from '../../domain/entities/sponsoredTransaction';
import { parseSponsoredTransaction } from './sponsoredTransactionValidation';

type CreateGameSubmissionTransactionResult = {
  serializedTx: string;
  submission: Submission;
  sponsoredRequest?: {
    requestId: number;
    expiresAt: Date;
  };
};

type SponsoredRequestStatusResult = {
  requestId: number;
  status: 'not_broadcasted' | 'processing' | 'pending' | 'success' | 'failed';
  txId?: string | null;
  originNonce?: number | null;
  adsRequired: number;
  adsWatchedCount: number;
};

const SPONSORED_TTL_MS = 15 * 60 * 1000;

/**
 * `SponsoredTransaction` is the execution source of truth for all ad-funded flows.
 * `Submission` owns the FK to its SponsoredTransaction (submission.sponsoredTransactionId)
 * and keeps transactionStatus/transactionId in sync so the rewards layer can query them
 * without joining through SponsoredTransaction.
 */
export class TransactionService {
  constructor(
    private transactionClient: TransactionClientPort,
    private submissionDomainService: SubmissionDomainService,
    private entityManager: EntityManager,
  ) {}

  /**
   * Creates the canonical game submission row and returns the unsigned transaction.
   * Sponsored game submissions also get a queue record for the later ad + worker flow.
   */
  async createGameSubmissionTransaction(
    userId: number,
    address: string,
    publicKey: string,
    score: number,
    submissionType: SubmissionType,
    isSponsored: boolean,
  ): Promise<CreateGameSubmissionTransactionResult> {
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

    const existingPending = await this.entityManager.find(Submission, {
      where: {
        user: { id: userId },
        transactionStatus: In([
          TransactionStatus.Pending,
          TransactionStatus.Processing,
        ]),
      },
    });
    if (existingPending.length > 0) {
      throw new TransactionAlreadySubmittedError(
        `Can't create a new submission while you have a pending or processing transaction`,
      );
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
    const serializedTx =
      await this.transactionClient.createTournamentUnsignedTransaction(
        address,
        publicKey,
        score,
        isSponsored,
      );

    if (!isSponsored) {
      return {
        serializedTx,
        submission: savedSubmission,
      };
    }

    const sponsoredRequest = await this.createSponsoredRequest(user, address);
    savedSubmission.sponsoredTransaction = sponsoredRequest;
    await this.entityManager.save(savedSubmission);

    return {
      serializedTx,
      submission: savedSubmission,
      sponsoredRequest: {
        requestId: sponsoredRequest.id,
        expiresAt: sponsoredRequest.expiresAt,
      },
    };
  }

  /**
   * Creates a sponsored queue record for non-game flows that build the unsigned tx on mobile.
   * When `defiOperationId` is supplied the request is bound to that swap operation and the
   * validator later verifies the signed tx against the exact contract call that was prepared.
   */
  async createSponsoredTransactionRequest(
    userId: number,
    originAddress: string,
    defiOperationId?: number,
  ): Promise<{ requestId: number; expiresAt: Date }> {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
    });
    if (!user) {
      throw new UserNotFoundError(
        `Invalid id, user with id ${userId} not found`,
      );
    }

    let defiOperation: DefiOperation | null = null;
    if (defiOperationId != null) {
      defiOperation = await this.entityManager.findOne(DefiOperation, {
        where: { id: defiOperationId, user: { id: userId } },
      });
      if (!defiOperation) {
        throw new DefiOperationNotFoundError(
          `Defi operation with id ${defiOperationId} not found for user with id ${userId}`,
        );
      }
      if (defiOperation.status !== TransactionStatus.NotBroadcasted) {
        throw new TransactionAlreadySubmittedError(
          `Defi operation ${defiOperationId} has already been submitted`,
        );
      }
      const existingSlot = await this.entityManager.findOne(
        SponsoredTransaction,
        {
          where: { defiOperation: { id: defiOperationId } },
        },
      );
      if (existingSlot) {
        throw new TransactionAlreadySubmittedError(
          `A sponsored request already exists for defi operation ${defiOperationId}`,
        );
      }
    }

    const sponsoredRequest = await this.createSponsoredRequest(
      user,
      originAddress,
    );

    if (defiOperation) {
      sponsoredRequest.defiOperation = defiOperation;
      await this.entityManager.save(sponsoredRequest);
    }

    return {
      requestId: sponsoredRequest.id,
      expiresAt: sponsoredRequest.expiresAt,
    };
  }

  /**
   * Stores the user-signed sponsored transaction after validating ownership, expiry and tx shape.
   */
  async enqueueSponsoredTransaction(
    userId: number,
    requestId: number,
    serializedTx: string,
    dependsOnRequestId?: number,
  ): Promise<SponsoredTransaction> {
    const sponsoredRequest = await this.loadOwnedSponsoredRequest(
      requestId,
      userId,
    );

    if (sponsoredRequest.status !== TransactionStatus.NotBroadcasted) {
      throw new TransactionAlreadySubmittedError(
        `Sponsored transaction ${requestId} has already been submitted`,
      );
    }
    if (sponsoredRequest.serializedTx) {
      throw new TransactionAlreadySubmittedError(
        `Sponsored transaction ${requestId} has already been signed`,
      );
    }

    this.assertRequestNotExpired(sponsoredRequest);

    const parsedTransaction = parseSponsoredTransaction(
      serializedTx,
      sponsoredRequest.defiOperation ?? undefined,
    );
    if (parsedTransaction.originAddress !== sponsoredRequest.originAddress) {
      throw new UnsupportedSponsoredTransactionError(
        'Signed transaction sender does not match the sponsored request address',
      );
    }

    if (sponsoredRequest.submission) {
      await this.assertSponsoredSubmissionCanBeQueued(
        userId,
        sponsoredRequest.submission,
      );

      if (parsedTransaction.kind !== 'submission') {
        throw new UnsupportedSponsoredTransactionError(
          'Submission sponsorship requests can only be used for score submissions',
        );
      }
    } else if (parsedTransaction.kind === 'submission') {
      throw new UnsupportedSponsoredTransactionError(
        'Game submissions must use /transaction/create',
      );
    }

    if (dependsOnRequestId != null) {
      const parent = await this.entityManager.findOne(SponsoredTransaction, {
        where: { id: dependsOnRequestId, user: { id: userId } },
      });
      if (!parent) {
        throw new SponsoredTransactionNotFoundError(
          `Dependent sponsored transaction ${dependsOnRequestId} not found`,
        );
      }
      if (parent.originAddress !== sponsoredRequest.originAddress) {
        throw new UnsupportedSponsoredTransactionError(
          'Dependent sponsored transaction must use the same origin address',
        );
      }
      sponsoredRequest.dependsOnRequestId = dependsOnRequestId;
    }

    sponsoredRequest.serializedTx = serializedTx;
    const isReadyForBroadcast =
      sponsoredRequest.adsWatchedCount >= sponsoredRequest.adsRequired ||
      NODE_ENV !== 'production';
    sponsoredRequest.status = isReadyForBroadcast
      ? TransactionStatus.Processing
      : TransactionStatus.NotBroadcasted;

    await this.entityManager.save(sponsoredRequest);

    if (isReadyForBroadcast) {
      await this.markLinkedSubmissionProcessing(sponsoredRequest);
    }

    return sponsoredRequest;
  }

  private async checkDbPendingDefiTransactionsCount(): Promise<number> {
    const pendingDefiOperations = await this.entityManager.find(DefiOperation, {
      where: {
        status: In([TransactionStatus.Pending, TransactionStatus.Processing]),
      },
      order: {
        createdAt: 'ASC',
      },
    });
    return pendingDefiOperations.length;
  }

  /**
   * Marks the ad gate as complete for a sponsored request after AdMob SSV verification succeeds.
   */
  async markSponsoredTransactionAdWatched(
    userId: number,
    requestIdRaw: string | number,
  ): Promise<void> {
    const requestId = this.parseSponsoredRequestId(requestIdRaw);
    const sponsoredRequest = await this.loadOwnedSponsoredRequest(
      requestId,
      userId,
    );

    this.assertRequestNotExpired(sponsoredRequest);

    if (sponsoredRequest.adsWatchedCount >= sponsoredRequest.adsRequired) {
      throw new AdAlreadyWatchedError(
        `Ad already watched for sponsored transaction ${requestId}`,
      );
    }
    if (sponsoredRequest.status !== TransactionStatus.NotBroadcasted) {
      throw new TransactionAlreadySubmittedError(
        `Sponsored transaction ${requestId} has already been submitted`,
      );
    }

    sponsoredRequest.adsWatchedCount += 1;
    const adRequirementMet =
      sponsoredRequest.adsWatchedCount >= sponsoredRequest.adsRequired;

    if (adRequirementMet && sponsoredRequest.serializedTx) {
      sponsoredRequest.status = TransactionStatus.Processing;
    }
    await this.entityManager.save(sponsoredRequest);

    if (adRequirementMet && sponsoredRequest.serializedTx) {
      await this.markLinkedSubmissionProcessing(sponsoredRequest);
    }
  }

  /**
   * Loads the current state of a sponsored request for the authenticated user.
   */
  async getSponsoredRequestStatus(
    userId: number,
    requestIdRaw: string | number,
  ): Promise<SponsoredRequestStatusResult> {
    const requestId = this.parseSponsoredRequestId(requestIdRaw);
    const sponsoredRequest = await this.loadOwnedSponsoredRequest(
      requestId,
      userId,
    );

    if (sponsoredRequest.status === TransactionStatus.Pending) {
      await this.refreshPendingSponsoredRequest(sponsoredRequest);
    }

    return this.serializeSponsoredRequestStatus(sponsoredRequest);
  }

  /**
   * Worker entry point. Refreshes already-broadcast pending rows, then sends queued rows in order.
   */
  async processSponsoredBroadcastQueue(): Promise<void> {
    logger.info({
      msg: 'Broadcasting sponsored transaction batch',
    });

    await this.refreshPendingSponsoredRequests();
    await this.broadcastQueuedSponsoredTransactions();

    const pendingCount = await this.checkDbPendingDefiTransactionsCount();
    logger.info({
      msg: 'Step 4: Updating DeFi pending transactions',
      pendingCount,
    });
    const defiOperations = await this.entityManager.find(DefiOperation, {
      where: {
        status: In([TransactionStatus.Pending, TransactionStatus.Processing]),
      },
      order: {
        createdAt: 'ASC',
      },
    });
    for (const operation of defiOperations) {
      if (operation.txId) {
        const transactionStatus =
          await this.transactionClient.getTransactionStatus(operation.txId);
        const txStatus =
          transactionStatus === 'success'
            ? TransactionStatus.Success
            : transactionStatus === 'pending'
              ? TransactionStatus.Pending
              : TransactionStatus.Failed;
        operation.status = txStatus;
        await this.entityManager.save(operation);
      }
    }
  }

  private async broadcastQueuedSponsoredTransactions(): Promise<void> {
    // Pending txs with a txId block unrelated broadcasts.
    const pendingTxs = await this.entityManager.find(SponsoredTransaction, {
      where: { status: TransactionStatus.Pending },
      select: ['id', 'originAddress', 'txId'],
    });

    const pendingOrigins = new Set(
      pendingTxs.filter((tx) => tx.txId).map((tx) => tx.originAddress),
    );
    const pendingTxIds = new Set(
      pendingTxs.filter((tx) => tx.txId).map((tx) => tx.id),
    );

    const queuedTransactions = await this.entityManager.find(
      SponsoredTransaction,
      {
        where: { status: TransactionStatus.Processing },
        relations: ['submission', 'defiOperation'],
        take: 25,
        order: { createdAt: 'ASC' },
      },
    );

    // Fail children whose parent already failed.
    const dependentIds = queuedTransactions
      .map((tx) => tx.dependsOnRequestId)
      .filter((id): id is number => id != null);

    if (dependentIds.length > 0) {
      const failedParents = await this.entityManager.find(
        SponsoredTransaction,
        {
          where: { id: In(dependentIds), status: TransactionStatus.Failed },
          select: ['id'],
        },
      );
      const failedParentIds = new Set(failedParents.map((p) => p.id));

      for (const tx of queuedTransactions) {
        if (
          tx.dependsOnRequestId &&
          failedParentIds.has(tx.dependsOnRequestId)
        ) {
          tx.status = TransactionStatus.Failed;
          await this.entityManager.save(tx);
          await this.syncLinkedSubmissionStatus(tx);
          logger.warn({
            msg: 'Cascading failure to child tx — parent failed',
            requestId: tx.id,
            dependsOnRequestId: tx.dependsOnRequestId,
          });
        }
      }
    }

    const stillQueued = queuedTransactions.filter(
      (tx) => tx.status === TransactionStatus.Processing,
    );

    const queuedIds = new Set(stillQueued.map((tx) => tx.id));
    const seenOrigins = new Set<string>();
    const eligible = stillQueued.filter((tx) => {
      if (tx.dependsOnRequestId && queuedIds.has(tx.dependsOnRequestId))
        return false;

      if (pendingOrigins.has(tx.originAddress)) {
        if (!tx.dependsOnRequestId) return false;
        if (!pendingTxIds.has(tx.dependsOnRequestId)) return false;
      }
      if (seenOrigins.has(tx.originAddress)) return false;
      seenOrigins.add(tx.originAddress);
      return true;
    });

    logger.info({
      msg: 'Broadcasting sponsored transactions',
      queuedCount: stillQueued.length,
      eligibleCount: eligible.length,
      skippedOrigins: pendingOrigins.size,
    });

    for (const queuedTransaction of eligible) {
      if (!queuedTransaction.serializedTx) {
        queuedTransaction.status = TransactionStatus.Failed;
        await this.entityManager.save(queuedTransaction);
        await this.syncLinkedSubmissionStatus(queuedTransaction);
        continue;
      }

      try {
        const txId = await this.transactionClient.broadcastSponsoredTransaction(
          queuedTransaction.serializedTx,
        );
        queuedTransaction.txId = txId;
        queuedTransaction.status = TransactionStatus.Pending;
        if (queuedTransaction.defiOperation) {
          queuedTransaction.defiOperation.txId = txId;
          queuedTransaction.defiOperation.status = TransactionStatus.Pending;
          await this.entityManager.save(queuedTransaction.defiOperation);
        }
      } catch (error) {
        queuedTransaction.status = TransactionStatus.Failed;
        logger.error({
          msg: 'Error broadcasting sponsored transaction',
          requestId: queuedTransaction.id,
          err: error,
        });
      }

      await this.entityManager.save(queuedTransaction);
      await this.syncLinkedSubmissionStatus(queuedTransaction);
    }
  }

  /**
   * Broadcasts a wallet-funded transaction immediately.
   * Only game submissions need an existing submission row to update after broadcast.
   */
  async broadcastWalletTransaction(
    userId: number,
    submissionId: number | undefined,
    serializedTx: string,
  ): Promise<TxBroadcastResult> {
    if (typeof submissionId !== 'number') {
      return await this.transactionClient.broadcastTransaction(serializedTx);
    }

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

  /**
   * Deletes failed or expired records that are no longer useful to keep around.
   */
  async cleanUpUnsuccessfulTransactions(): Promise<void> {
    const tournamentId = await this.transactionClient.getTournamentId();
    const failedSubmissions = await this.entityManager.delete(Submission, {
      tournamentId,
      transactionStatus: TransactionStatus.Failed,
    });
    logger.info({
      msg: 'Deleted failed submissions',
      tournamentId,
      deletedCount: failedSubmissions.affected || 0,
    });

    const staleSubmissions = await this.entityManager.delete(Submission, {
      tournamentId,
      transactionStatus: TransactionStatus.NotBroadcasted,
      createdAt: LessThan(new Date(Date.now() - 1000 * 60 * 60 * 24)),
    });
    logger.info({
      msg: 'Deleted stale not-broadcasted submissions',
      tournamentId,
      deletedCount: staleSubmissions.affected || 0,
    });

    const staleSponsoredTransactions = await this.entityManager.delete(
      SponsoredTransaction,
      {
        status: TransactionStatus.Failed,
      },
    );
    logger.info({
      msg: 'Deleted failed sponsored transactions',
      deletedCount: staleSponsoredTransactions.affected || 0,
    });

    const expiredSponsoredTransactions = await this.entityManager
      .createQueryBuilder()
      .delete()
      .from(SponsoredTransaction)
      .where('"status" = :status', {
        status: TransactionStatus.NotBroadcasted,
      })
      .andWhere('"expiresAt" < :now', { now: new Date() })
      .execute();
    logger.info({
      msg: 'Deleted expired sponsored transactions',
      deletedCount: expiredSponsoredTransactions.affected || 0,
    });
  }

  /** Creates the durable queue row used by all sponsored flows. */
  private async createSponsoredRequest(
    user: User,
    originAddress: string,
  ): Promise<SponsoredTransaction> {
    const sponsoredRequest = new SponsoredTransaction();
    sponsoredRequest.user = user;
    sponsoredRequest.originAddress = originAddress;
    sponsoredRequest.status = TransactionStatus.NotBroadcasted;
    sponsoredRequest.expiresAt = new Date(Date.now() + SPONSORED_TTL_MS);
    return await this.entityManager.save(sponsoredRequest);
  }

  /**
   * Loads a sponsored request and enforces that it belongs to the authenticated user.
   */
  private async loadOwnedSponsoredRequest(
    requestId: number,
    userId: number,
  ): Promise<SponsoredTransaction> {
    const sponsoredRequest = await this.entityManager.findOne(
      SponsoredTransaction,
      {
        where: { id: requestId },
        relations: ['user', 'submission', 'defiOperation'],
      },
    );

    if (!sponsoredRequest) {
      throw new SponsoredTransactionNotFoundError(
        `Sponsored transaction ${requestId} not found`,
      );
    }
    if (sponsoredRequest.user.id !== userId) {
      throw new SponsoredTransactionForbiddenError(
        `Sponsored transaction ${requestId} does not belong to this user`,
      );
    }

    return sponsoredRequest;
  }

  private assertRequestNotExpired(
    sponsoredRequest: SponsoredTransaction,
  ): void {
    if (sponsoredRequest.expiresAt.getTime() < Date.now()) {
      throw new SponsoredTransactionExpiredError(
        `Sponsored transaction ${sponsoredRequest.id} has expired`,
      );
    }
  }

  /**
   * Maps internal transaction state to the sponsored request status returned to mobile clients.
   */
  private serializeSponsoredRequestStatus(
    sponsoredRequest: SponsoredTransaction,
  ): SponsoredRequestStatusResult {
    const originNonce = sponsoredRequest.serializedTx
      ? parseSponsoredTransaction(sponsoredRequest.serializedTx).originNonce
      : null;
    return {
      requestId: sponsoredRequest.id,
      status: this.getSponsoredRequestStatusName(sponsoredRequest.status),
      txId: sponsoredRequest.txId ?? null,
      originNonce,
      adsRequired: sponsoredRequest.adsRequired,
      adsWatchedCount: sponsoredRequest.adsWatchedCount,
    };
  }

  private getSponsoredRequestStatusName(
    status: TransactionStatus,
  ): SponsoredRequestStatusResult['status'] {
    switch (status) {
      case TransactionStatus.NotBroadcasted:
        return 'not_broadcasted';
      case TransactionStatus.Processing:
        return 'processing';
      case TransactionStatus.Pending:
        return 'pending';
      case TransactionStatus.Success:
        return 'success';
      case TransactionStatus.Failed:
      default:
        return 'failed';
    }
  }

  /**
   * Refreshes pending sponsored rows from chain state before we try to broadcast more.
   */
  private async refreshPendingSponsoredRequests(): Promise<void> {
    const pendingTransactions = await this.entityManager.find(
      SponsoredTransaction,
      {
        where: { status: TransactionStatus.Pending },
        relations: ['submission'],
      },
    );

    for (const pendingTransaction of pendingTransactions) {
      await this.refreshPendingSponsoredRequest(pendingTransaction);
    }
  }

  private async refreshPendingSponsoredRequest(
    sponsoredRequest: SponsoredTransaction,
  ): Promise<void> {
    if (!sponsoredRequest.txId) {
      sponsoredRequest.status = TransactionStatus.Failed;
      await this.entityManager.save(sponsoredRequest);
      await this.syncLinkedSubmissionStatus(sponsoredRequest);
      return;
    }

    try {
      const txStatus = await this.transactionClient.getTransactionStatus(
        sponsoredRequest.txId,
      );

      sponsoredRequest.status =
        txStatus === 'success'
          ? TransactionStatus.Success
          : txStatus === 'pending' || txStatus === 'dropped_replace_by_fee'
            ? TransactionStatus.Pending
            : TransactionStatus.Failed;

      await this.entityManager.save(sponsoredRequest);
      await this.syncLinkedSubmissionStatus(sponsoredRequest);
    } catch (error) {
      logger.error({
        msg: 'Error checking sponsored transaction status',
        requestId: sponsoredRequest.id,
        txId: sponsoredRequest.txId,
        err: error,
      });
    }
  }

  /**
   * Enforces that a sponsored game submission still belongs to the active tournament submit phase.
   */
  private async assertSponsoredSubmissionCanBeQueued(
    userId: number,
    submission: Submission,
  ): Promise<void> {
    const tournamentId = await this.transactionClient.getTournamentId();
    let tournamentStatus = await this.entityManager.find(TournamentStatus, {
      where: { tournamentId },
    });

    if (tournamentStatus.length === 0) {
      logger.info({
        msg: 'Tournament status not found, initializing...',
        tournamentId,
      });
      await this.initializeTournamentStatus(tournamentId);
      tournamentStatus = await this.entityManager.find(TournamentStatus, {
        where: { tournamentId },
      });
      if (tournamentStatus.length === 0) {
        throw new TournamentStatusNotFoundError(
          'Failed to initialize tournament status',
        );
      }
    }

    const currentTournamentStatus = tournamentStatus[0];
    if (currentTournamentStatus.status !== TournamentStatusEnum.SubmitPhase) {
      throw new SubmissionPhaseFinishedError(
        'Tournament is not in submit phase',
      );
    }

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

    if (submission.transactionStatus !== TransactionStatus.NotBroadcasted) {
      throw new TransactionAlreadySubmittedError(
        `Transaction already submitted for submission with id ${submission.id}`,
      );
    }

    if (!submission.isSponsored) {
      throw new TransactionNotSponsoredError(
        `Transaction with id ${submission.id} should be sponsored in order to be processed`,
      );
    }
  }

  private async initializeTournamentStatus(
    tournamentId: number,
  ): Promise<void> {
    const tournamentStatus = new TournamentStatus();
    tournamentStatus.resetTournament(tournamentId);
    await this.entityManager.save(tournamentStatus);
    logger.info({
      msg: 'Tournament status initialized',
      tournamentId,
    });
  }

  /**
   * Mirrors the queue row state back into the linked game submission, when one exists.
   */
  private async syncLinkedSubmissionStatus(
    sponsoredRequest: SponsoredTransaction,
  ): Promise<void> {
    if (!sponsoredRequest.submission) {
      return;
    }

    sponsoredRequest.submission.transactionId =
      sponsoredRequest.txId ?? undefined;
    sponsoredRequest.submission.transactionStatus = sponsoredRequest.status;

    await this.entityManager.save(sponsoredRequest.submission);
  }

  private async markLinkedSubmissionProcessing(
    sponsoredRequest: SponsoredTransaction,
  ): Promise<void> {
    if (!sponsoredRequest.submission) {
      return;
    }
    sponsoredRequest.submission.transactionStatus =
      TransactionStatus.Processing;
    await this.entityManager.save(sponsoredRequest.submission);
  }

  /** Accepts numeric ids from HTTP/query input and rejects anything else early. */
  private parseSponsoredRequestId(requestIdRaw: string | number): number {
    const requestId =
      typeof requestIdRaw === 'number' ? requestIdRaw : Number(requestIdRaw);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      throw new SponsoredTransactionNotFoundError(
        'Invalid sponsored transaction id',
      );
    }

    return requestId;
  }
}
