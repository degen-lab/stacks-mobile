import { EntityManager } from 'typeorm';
import { TransactionService } from '../../../src/application/transaction/transactionService';
import { TransactionClientPort } from '../../../src/application/ports/transactionClientPort';
import { SubmissionDomainService } from '../../../src/domain/service/submissionDomainService';
import { User } from '../../../src/domain/entities/user';
import { Submission } from '../../../src/domain/entities/submission';
import { SponsoredTransaction } from '../../../src/domain/entities/sponsoredTransaction';
import {
  SubmissionType,
  TransactionStatus,
} from '../../../src/domain/entities/enums';
import { parseSponsoredTransaction } from '../../../src/application/transaction/sponsoredTransactionValidation';

jest.mock(
  '../../../src/application/transaction/sponsoredTransactionValidation',
  () => ({
    parseSponsoredTransaction: jest.fn(),
  }),
);

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionClientMock: jest.Mocked<TransactionClientPort>;
  let submissionDomainServiceMock: jest.Mocked<SubmissionDomainService>;
  let entityManagerMock: jest.Mocked<EntityManager>;

  beforeEach(() => {
    transactionClientMock = {
      createTournamentUnsignedTransaction: jest.fn(),
      broadcastSponsoredTransaction: jest.fn(),
      broadcastTransaction: jest.fn(),
      getTournamentId: jest.fn(),
      distributeRewards: jest.fn(),
      headToNextTournament: jest.fn(),
      getTransactionStatus: jest.fn(),
      fetchStackingTransactionData: jest.fn(),
      fetchPoxCycleData: jest.fn(),
    } as unknown as jest.Mocked<TransactionClientPort>;

    submissionDomainServiceMock = {
      createSubmission: jest.fn(),
    } as unknown as jest.Mocked<SubmissionDomainService>;

    entityManagerMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    service = new TransactionService(
      transactionClientMock,
      submissionDomainServiceMock,
      entityManagerMock,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates an unsigned wallet-funded submission transaction', async () => {
    const user = new User();
    user.id = 7;
    user.isBlackListed = false;

    const submission = new Submission();
    submission.id = 19;

    entityManagerMock.findOne.mockResolvedValue(user);
    entityManagerMock.save.mockResolvedValue(submission);
    transactionClientMock.getTournamentId.mockResolvedValue(44);
    submissionDomainServiceMock.createSubmission.mockReturnValue(submission);
    transactionClientMock.createTournamentUnsignedTransaction.mockResolvedValue(
      'unsigned-submission',
    );

    const result = await service.createGameSubmissionTransaction(
      user.id,
      'STTESTADDRESS',
      'public-key',
      123,
      SubmissionType.WeeklyContest,
      false,
    );

    expect(
      transactionClientMock.createTournamentUnsignedTransaction,
    ).toHaveBeenCalledWith('STTESTADDRESS', 'public-key', 123, false);
    expect(result).toEqual({
      serializedTx: 'unsigned-submission',
      submission,
    });
  });

  it('creates a sponsored submission request linked to the submission', async () => {
    const user = new User();
    user.id = 11;
    user.isBlackListed = false;
    user.submissions = [];
    user.fraudAttempts = [];

    const submission = new Submission();
    submission.id = 31;

    const sponsoredTransaction = new SponsoredTransaction();
    sponsoredTransaction.id = 55;
    sponsoredTransaction.expiresAt = new Date('2026-03-12T10:15:00.000Z');

    entityManagerMock.findOne.mockResolvedValue(user);
    entityManagerMock.save
      .mockResolvedValueOnce(submission)
      .mockResolvedValueOnce(sponsoredTransaction);
    transactionClientMock.getTournamentId.mockResolvedValue(9);
    submissionDomainServiceMock.createSubmission.mockReturnValue(submission);
    transactionClientMock.createTournamentUnsignedTransaction.mockResolvedValue(
      'unsigned-sponsored-submission',
    );

    const result = await service.createGameSubmissionTransaction(
      user.id,
      'STSPONSORED',
      'public-key',
      88,
      SubmissionType.Raffle,
      true,
    );

    expect(result.sponsoredRequest).toEqual({
      requestId: 55,
      expiresAt: sponsoredTransaction.expiresAt,
    });
  });

  it('creates a generic sponsored transaction request', async () => {
    const user = new User();
    user.id = 4;

    const sponsoredTransaction = new SponsoredTransaction();
    sponsoredTransaction.id = 91;
    sponsoredTransaction.expiresAt = new Date('2026-03-12T11:00:00.000Z');

    entityManagerMock.findOne.mockResolvedValue(user);
    entityManagerMock.save.mockResolvedValue(sponsoredTransaction);

    await expect(
      service.createSponsoredTransactionRequest(user.id, 'STORIGIN'),
    ).resolves.toEqual({
      requestId: 91,
      expiresAt: sponsoredTransaction.expiresAt,
    });
  });

  it('queues a generic sponsored transaction after validation', async () => {
    const user = new User();
    user.id = 3;

    const sponsoredTransaction = new SponsoredTransaction();
    sponsoredTransaction.id = 15;
    sponsoredTransaction.user = user;
    sponsoredTransaction.originAddress = 'STORIGIN';
    sponsoredTransaction.status = TransactionStatus.NotBroadcasted;
    sponsoredTransaction.adWatched = false;
    sponsoredTransaction.expiresAt = new Date(Date.now() + 60_000);

    entityManagerMock.findOne.mockResolvedValue(sponsoredTransaction);
    entityManagerMock.save.mockResolvedValue(sponsoredTransaction);
    jest.mocked(parseSponsoredTransaction).mockReturnValue({
      kind: 'contract_call',
      originAddress: 'STORIGIN',
      originNonce: 0,
      contractId: 'STTEST.contract',
      functionName: 'enroll',
    });

    const result = await service.enqueueSponsoredTransaction(
      user.id,
      sponsoredTransaction.id,
      'signed-generic-tx',
    );

    expect(result.status).toBe(TransactionStatus.Processing);
    expect(result.serializedTx).toBe('signed-generic-tx');
    expect(entityManagerMock.save).toHaveBeenCalledWith(sponsoredTransaction);
  });

  it('marks a sponsored transaction ad as watched', async () => {
    const user = new User();
    user.id = 5;

    const submission = new Submission();
    submission.id = 22;

    const sponsoredTransaction = new SponsoredTransaction();
    sponsoredTransaction.id = 23;
    sponsoredTransaction.user = user;
    sponsoredTransaction.submission = submission;
    sponsoredTransaction.status = TransactionStatus.NotBroadcasted;
    sponsoredTransaction.adWatched = false;
    sponsoredTransaction.expiresAt = new Date(Date.now() + 60_000);

    entityManagerMock.findOne.mockResolvedValue(sponsoredTransaction);
    entityManagerMock.save
      .mockResolvedValueOnce(sponsoredTransaction)
      .mockResolvedValueOnce(submission);

    await service.markSponsoredTransactionAdWatched(user.id, String(23));

    expect(sponsoredTransaction.adWatched).toBe(true);
    expect(entityManagerMock.save).toHaveBeenCalledWith(sponsoredTransaction);
  });

  it('moves a signed sponsored submission into processing when ad verification arrives after signing', async () => {
    const user = new User();
    user.id = 6;

    const submission = new Submission();
    submission.id = 42;
    submission.transactionStatus = TransactionStatus.NotBroadcasted;

    const sponsoredTransaction = new SponsoredTransaction();
    sponsoredTransaction.id = 24;
    sponsoredTransaction.user = user;
    sponsoredTransaction.submission = submission;
    sponsoredTransaction.status = TransactionStatus.NotBroadcasted;
    sponsoredTransaction.adWatched = false;
    sponsoredTransaction.serializedTx = 'signed-sponsored-submission';
    sponsoredTransaction.expiresAt = new Date(Date.now() + 60_000);

    entityManagerMock.findOne.mockResolvedValue(sponsoredTransaction);
    entityManagerMock.save
      .mockResolvedValueOnce(sponsoredTransaction)
      .mockResolvedValueOnce(submission);

    await service.markSponsoredTransactionAdWatched(user.id, String(24));

    expect(sponsoredTransaction.adWatched).toBe(true);
    expect(sponsoredTransaction.status).toBe(TransactionStatus.Processing);
    expect(submission.transactionStatus).toBe(TransactionStatus.Processing);
  });

  it('broadcasts a wallet-funded non-submission transaction directly', async () => {
    transactionClientMock.broadcastTransaction.mockResolvedValue({
      txid: '0xabc',
    });

    await expect(
      service.broadcastWalletTransaction(1, undefined, 'signed-wallet-tx'),
    ).resolves.toEqual({
      txid: '0xabc',
    });
  });

  it('broadcasts a wallet-funded submission and updates the submission state', async () => {
    const submission = new Submission();
    submission.id = 10;
    submission.transactionStatus = TransactionStatus.NotBroadcasted;

    entityManagerMock.findOne.mockResolvedValue(submission);
    entityManagerMock.save.mockResolvedValue(submission);
    transactionClientMock.broadcastTransaction.mockResolvedValue({
      txid: '0xsubmission',
    });

    await service.broadcastWalletTransaction(1, 10, 'signed-submission');

    expect(submission.transactionId).toBe('0xsubmission');
    expect(submission.transactionStatus).toBe(TransactionStatus.Success);
    expect(entityManagerMock.save).toHaveBeenCalledWith(submission);
  });
});
