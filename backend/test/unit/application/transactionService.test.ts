import { TransactionService } from '../../../src/application/transaction/transactionService';
import { TransactionClientPort } from '../../../src/application/ports/transactionClient';
import { SubmissionDomainService } from '../../../src/domain/service/submissionDomainService';
import { EntityManager } from 'typeorm';
import { User } from '../../../src/domain/entities/user';
import { Submission } from '../../../src/domain/entities/submission';
import { TournamentStatus } from '../../../src/domain/entities/tournamentStatus';
import {
  SubmissionType,
  TournamentStatusEnum,
  TransactionStatus,
} from '../../../src/domain/entities/enums';

describe('TransactionService application class Unit tests', () => {
  let transactionService: TransactionService;
  let mockTransactionClient: jest.Mocked<TransactionClientPort>;
  let mockSubmissionDomainService: jest.Mocked<SubmissionDomainService>;
  let mockEntityManager: jest.Mocked<EntityManager>;
  beforeEach(() => {
    mockTransactionClient = {
      createTournamentUnsignedTransaction: jest.fn(),
      broadcastSponsoredTransaction: jest.fn(),
      broadcastTransaction: jest.fn(),
      getTournamentId: jest.fn(),
    } as unknown as jest.Mocked<TransactionClientPort>;
    mockSubmissionDomainService = {
      createSubmission: jest.fn(),
    } as unknown as jest.Mocked<SubmissionDomainService>;
    mockEntityManager = {
      transaction: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]), // Default: no pending submissions
      save: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;
    transactionService = new TransactionService(
      mockTransactionClient,
      mockSubmissionDomainService,
      mockEntityManager,
    );
  });
  describe('createUnsignedTransaction', () => {
    it('should create an unsigned transaction successfully', async () => {
      const address = 'mockedAddress';
      const publicKey = 'mockedPublicKey';
      const score = 100;
      const userId = 1;
      const user = new User();
      user.id = userId;
      user.isBlackListed = false;
      const submission = new Submission();
      submission.id = 1;
      submission.score = score;
      mockEntityManager.findOne.mockResolvedValue(user);
      mockEntityManager.save.mockResolvedValue(submission);
      mockTransactionClient.getTournamentId.mockResolvedValue(1);
      mockTransactionClient.createTournamentUnsignedTransaction.mockResolvedValue(
        'mockedSerializedTx',
      );
      const result = await transactionService.createUnsignedTransaction(
        userId,
        address,
        publicKey,
        score,
        SubmissionType.WeeklyContest,
        false,
      );
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: userId },
        relations: ['fraudAttempts', 'submissions'],
      });
      expect(
        mockTransactionClient.createTournamentUnsignedTransaction,
      ).toHaveBeenCalledWith(address, publicKey, score, false);
      expect(result).toEqual({
        serializedTx: 'mockedSerializedTx',
        submission: expect.any(Submission),
      });
    });
  });
  describe('submitContestScore', () => {
    it('should submit a contest score successfully', async () => {
      const userId = 1;
      const submissionId = 1;
      const serializedTx = 'mockedSerializedTx';
      const submission = new Submission();
      submission.id = submissionId;
      submission.user = { id: userId } as User;
      submission.transactionStatus = TransactionStatus.NotBroadcasted;
      mockTransactionClient.broadcastSponsoredTransaction.mockResolvedValue(
        'mockedTxId',
      );
      mockEntityManager.find.mockResolvedValue([]); // No pending transactions
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<string>) => {
          return (await callback({
            findOne: jest.fn().mockResolvedValue(submission),
            save: jest.fn().mockResolvedValue(submission),
          } as unknown as EntityManager)) as unknown as Promise<string>;
        },
      );
      const result = await transactionService.submitContestScore(
        userId,
        submissionId,
        serializedTx,
      );
      expect(mockEntityManager.transaction).toHaveBeenCalled();
      expect(result).toEqual('mockedTxId');
    });
    it('should throw an error if submission is not found', async () => {
      const userId = 1;
      const submissionId = 1;
      const serializedTx = 'mockedSerializedTx';
      mockEntityManager.find.mockResolvedValue([]); // No pending transactions
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback({
            findOne: jest.fn().mockResolvedValue(null), // Submission not found
          } as unknown as EntityManager);
        },
      );
      await expect(
        transactionService.submitContestScore(
          userId,
          submissionId,
          serializedTx,
        ),
      ).rejects.toThrow('Invalid id, submission with id');
    });
    it('should throw an error if submission is already submitted', async () => {
      const userId = 1;
      const submissionId = 1;
      const serializedTx = 'mockedSerializedTx';
      const submission = new Submission();
      submission.id = submissionId;
      submission.user = { id: userId } as User;
      submission.transactionStatus = TransactionStatus.Pending; // Already submitted
      mockEntityManager.find.mockResolvedValue([]); // No pending transactions
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback({
            findOne: jest.fn().mockResolvedValue(submission),
          } as unknown as EntityManager);
        },
      );
      await expect(
        transactionService.submitContestScore(
          userId,
          submissionId,
          serializedTx,
        ),
      ).rejects.toThrow('Transaction already submitted');
    });
  });

  describe('processSubmissionTransaction', () => {
    it('should process submission transaction successfully', async () => {
      const userId = 1;
      const submissionId = 1;
      const serializedTx = 'mockedSerializedTx';
      const tournamentId = 1;

      const tournamentStatus = new TournamentStatus();
      tournamentStatus.tournamentId = tournamentId;
      tournamentStatus.status = TournamentStatusEnum.SubmitPhase;

      const submission = new Submission();
      submission.id = submissionId;
      submission.user = { id: userId } as User;
      submission.transactionStatus = TransactionStatus.NotBroadcasted;
      submission.isSponsored = true;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockEntityManager.find.mockResolvedValueOnce([tournamentStatus]);
      mockEntityManager.findOne.mockResolvedValueOnce(submission);
      mockEntityManager.find.mockResolvedValueOnce([]); // No pending submissions
      mockEntityManager.save.mockResolvedValue(submission);

      const result = await transactionService.processSubmissionTransaction(
        userId,
        submissionId,
        serializedTx,
      );

      expect(mockTransactionClient.getTournamentId).toHaveBeenCalled();
      expect(mockEntityManager.find).toHaveBeenCalledWith(TournamentStatus, {
        where: { tournamentId },
      });
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Submission, {
        where: { id: submissionId, user: { id: userId } },
      });
      expect(result.transactionStatus).toBe(TransactionStatus.Processing);
      expect(result.serializedTx).toBe(serializedTx);
      expect(mockEntityManager.save).toHaveBeenCalledWith(submission);
    });

    it('should throw error if tournament status not found', async () => {
      const userId = 1;
      const submissionId = 1;
      const serializedTx = 'mockedSerializedTx';
      const tournamentId = 1;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockEntityManager.find.mockResolvedValueOnce([]); // No tournament status

      await expect(
        transactionService.processSubmissionTransaction(
          userId,
          submissionId,
          serializedTx,
        ),
      ).rejects.toThrow('Failed to initialize tournament status');
    });

    it('should throw error if tournament is not in SubmitPhase', async () => {
      const userId = 1;
      const submissionId = 1;
      const serializedTx = 'mockedSerializedTx';
      const tournamentId = 1;

      const tournamentStatus = new TournamentStatus();
      tournamentStatus.tournamentId = tournamentId;
      tournamentStatus.status = TournamentStatusEnum.DistributionPhase;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockEntityManager.find.mockResolvedValueOnce([tournamentStatus]);

      await expect(
        transactionService.processSubmissionTransaction(
          userId,
          submissionId,
          serializedTx,
        ),
      ).rejects.toThrow('Tournament is not in submit phase');
    });

    it('should throw error if submission not found', async () => {
      const userId = 1;
      const submissionId = 1;
      const serializedTx = 'mockedSerializedTx';
      const tournamentId = 1;

      const tournamentStatus = new TournamentStatus();
      tournamentStatus.tournamentId = tournamentId;
      tournamentStatus.status = TournamentStatusEnum.SubmitPhase;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockEntityManager.find.mockResolvedValueOnce([tournamentStatus]);
      mockEntityManager.findOne.mockResolvedValueOnce(null); // Submission not found
      mockEntityManager.find.mockResolvedValueOnce([]); // No pending submissions

      await expect(
        transactionService.processSubmissionTransaction(
          userId,
          submissionId,
          serializedTx,
        ),
      ).rejects.toThrow('Invalid id, submission with id');
    });

    it('should throw error if user has pending submissions', async () => {
      const userId = 1;
      const submissionId = 1;
      const serializedTx = 'mockedSerializedTx';
      const tournamentId = 1;

      const tournamentStatus = new TournamentStatus();
      tournamentStatus.tournamentId = tournamentId;
      tournamentStatus.status = TournamentStatusEnum.SubmitPhase;

      const submission = new Submission();
      submission.id = submissionId;
      submission.user = { id: userId } as User;

      const pendingSubmission = new Submission();
      pendingSubmission.id = 2;
      pendingSubmission.transactionStatus = TransactionStatus.Pending;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockEntityManager.find.mockResolvedValueOnce([tournamentStatus]);
      mockEntityManager.findOne.mockResolvedValueOnce(submission);
      mockEntityManager.find.mockResolvedValueOnce([pendingSubmission]); // Has pending submission

      await expect(
        transactionService.processSubmissionTransaction(
          userId,
          submissionId,
          serializedTx,
        ),
      ).rejects.toThrow("Can't have more than one pending submission");
    });
  });
});
