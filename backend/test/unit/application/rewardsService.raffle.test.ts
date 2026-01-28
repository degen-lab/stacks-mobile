import { RewardsService } from '../../../src/application/rewards/rewardsService';
import { RewardsCalculator } from '../../../src/domain/service/rewardsCalculator';
import { Submission } from '../../../src/domain/entities/submission';
import {
  SubmissionType,
  TransactionStatus,
} from '../../../src/domain/entities/enums';
import { TransactionClientPort } from '../../../src/application/ports/transactionClientPort';
import { EntityManager } from 'typeorm';
import { User } from '../../../src/domain/entities/user';

describe('RewardsService - extractRaffleWinners', () => {
  const transactionClientMock: jest.Mocked<
    Pick<TransactionClientPort, 'getTournamentId' | 'distributeRewards'>
  > = {
    getTournamentId: jest.fn(),
    distributeRewards: jest.fn(),
  };

  const rewardsCalculatorMock = {} as RewardsCalculator;

  let rewardsService: RewardsService;
  let managerFindMock: jest.Mock;
  let entityManagerMock: EntityManager;

  beforeEach(() => {
    managerFindMock = jest.fn();

    entityManagerMock = {
      transaction: jest
        .fn()
        .mockImplementation(
          async (fn: (m: EntityManager) => Promise<Submission[]>) =>
            fn({ find: managerFindMock } as unknown as EntityManager),
        ),
    } as unknown as EntityManager;

    transactionClientMock.getTournamentId.mockResolvedValue(123);

    rewardsService = new RewardsService(
      rewardsCalculatorMock,
      transactionClientMock as unknown as TransactionClientPort,
      entityManagerMock,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty when no raffle submissions', async () => {
    managerFindMock.mockResolvedValue([]);

    const winners = await rewardsService.extractRaffleWinners();

    expect(transactionClientMock.getTournamentId).toHaveBeenCalled();
    expect(managerFindMock).toHaveBeenCalledWith(Submission, {
      where: {
        tournamentId: 123,
        type: SubmissionType.Raffle,
        transactionStatus: TransactionStatus.Success,
      },
      relations: ['user'],
    });
    expect(winners).toHaveLength(0);
  });

  it('returns up to count winners, sampled randomly (deterministic)', async () => {
    const submissions: Submission[] = Array.from({ length: 5 }).map((_, i) => {
      const s = new Submission();
      s.id = i + 1;
      s.stacksAddress = `addr-${i + 1}`;
      s.user = { id: i + 10 } as User;
      return s;
    });
    managerFindMock.mockResolvedValue(submissions);

    // Deterministic random: ascending values keeps original order
    const randomSpy = jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5);

    const winners = await rewardsService.extractRaffleWinners(3);

    expect(randomSpy).toHaveBeenCalledTimes(5);
    expect(winners).toHaveLength(3);
    expect(winners.map((w) => w.id)).toEqual([1, 2, 3]);
  });
});
