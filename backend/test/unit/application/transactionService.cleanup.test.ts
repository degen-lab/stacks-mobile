import { TransactionService } from '../../../src/application/transaction/transactionService';
import { TransactionClientPort } from '../../../src/application/ports/transactionClientPort';
import { SubmissionDomainService } from '../../../src/domain/service/submissionDomainService';
import { EntityManager, FindOperator } from 'typeorm';
import { Submission } from '../../../src/domain/entities/submission';
import { TransactionStatus } from '../../../src/domain/entities/enums';

describe('TransactionService - cleanUpUnsuccessfullSubmissions', () => {
  let service: TransactionService;
  let transactionClientMock: jest.Mocked<TransactionClientPort>;
  let submissionDomainServiceMock: jest.Mocked<SubmissionDomainService>;
  let entityManagerMock: jest.Mocked<EntityManager>;

  beforeEach(() => {
    transactionClientMock = {
      createTournamentUnsignedTransaction: jest.fn(),
      broadcastSponsoredTransaction: jest.fn(),
      broadcastTransaction: jest.fn(),
      getTournamentId: jest.fn().mockResolvedValue(7),
      getTransactionStatus: jest.fn(),
      distributeRewards: jest.fn(),
      headToNextTournament: jest.fn(),
    } as unknown as jest.Mocked<TransactionClientPort>;

    submissionDomainServiceMock = {
      createSubmission: jest.fn(),
    } as unknown as jest.Mocked<SubmissionDomainService>;

    entityManagerMock = {
      delete: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      transaction: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // Return shape similar to DeleteResult
    (entityManagerMock.delete as jest.Mock).mockResolvedValue({ affected: 0 });

    service = new TransactionService(
      transactionClientMock,
      submissionDomainServiceMock,
      entityManagerMock,
    );
  });

  it('deletes only failed and stale not-broadcasted submissions for current tournament', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    await service.cleanUpUnsuccessfullSubmissions();

    expect(transactionClientMock.getTournamentId).toHaveBeenCalledTimes(1);
    // First delete: failed submissions for this tournament
    expect(entityManagerMock.delete).toHaveBeenNthCalledWith(
      1,
      Submission,
      expect.objectContaining({
        where: {
          tournamentId: 7,
          transactionStatus: TransactionStatus.Failed,
        },
      }),
    );

    // Second delete: not broadcasted older than 1 day for this tournament
    const secondCallArgs = (entityManagerMock.delete as jest.Mock).mock
      .calls[1];
    expect(secondCallArgs[0]).toBe(Submission);
    const whereClause = secondCallArgs[1].where;
    expect(whereClause.tournamentId).toBe(7);
    expect(whereClause.transactionStatus).toBe(
      TransactionStatus.NotBroadcasted,
    );
    expect(whereClause.createdAt).toBeInstanceOf(FindOperator);
    // Check the LessThan value is roughly now - 1 day
    const lessThanVal = (whereClause.createdAt as FindOperator<Date>).value;
    const oneDayMs = 1000 * 60 * 60 * 24;
    expect(
      Math.abs((lessThanVal as Date).getTime() - (now - oneDayMs)),
    ).toBeLessThanOrEqual(1000);
  });
});
