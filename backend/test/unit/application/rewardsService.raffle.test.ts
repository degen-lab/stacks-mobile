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
import { RewardsDistributionData } from '../../../src/domain/entities/rewardsDistributionData';
import { RAFFLE_TIER_BONUS } from '../../../src/shared/constants';

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

  it('returns up to count winners with mocked random sampling', async () => {
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

  it('awards raffle winners points and saves a points distribution reference', async () => {
    const winnerOne = new Submission();
    winnerOne.id = 1;
    winnerOne.stacksAddress = 'addr-1';
    const winnerOneUser = new User();
    winnerOneUser.id = 10;
    winnerOneUser.points = 100;
    winnerOneUser.googleId = 'google-10';
    winnerOneUser.nickName = 'winner-10';
    winnerOneUser.referralCode = 'WINNER10';
    winnerOne.user = winnerOneUser;

    const winnerTwo = new Submission();
    winnerTwo.id = 2;
    winnerTwo.stacksAddress = 'addr-2';
    const winnerTwoUser = new User();
    winnerTwoUser.id = 11;
    winnerTwoUser.points = 200;
    winnerTwoUser.googleId = 'google-11';
    winnerTwoUser.nickName = 'winner-11';
    winnerTwoUser.referralCode = 'WINNER11';
    winnerTwo.user = winnerTwoUser;

    jest
      .spyOn(rewardsService, 'extractRaffleWinners')
      .mockResolvedValue([winnerOne, winnerTwo]);

    const saveMock = jest.fn().mockImplementation(async (entity) => entity);
    (entityManagerMock.transaction as jest.Mock).mockImplementation(
      async (fn: (m: EntityManager) => Promise<void>) =>
        fn({ save: saveMock } as unknown as EntityManager),
    );

    const transactionId = await rewardsService.distributeRaffleRewards(2);

    expect(transactionId).toBe('points-distribution:raffle:123');
    expect(winnerOne.user.points).toBe(100 + RAFFLE_TIER_BONUS);
    expect(winnerTwo.user.points).toBe(200 + RAFFLE_TIER_BONUS);
    expect(saveMock).toHaveBeenCalledWith(winnerOne.user);
    expect(saveMock).toHaveBeenCalledWith(winnerTwo.user);
    expect(transactionClientMock.distributeRewards).not.toHaveBeenCalled();

    const savedDistribution = saveMock.mock.calls.find(
      (call) => call[0] instanceof RewardsDistributionData,
    )?.[0] as RewardsDistributionData;
    expect(savedDistribution).toBeDefined();
    expect(savedDistribution.tournamentId).toBe(123);
    expect(savedDistribution.transactionId).toBe(
      'points-distribution:raffle:123',
    );
    expect(savedDistribution.rewardedSubmissions).toEqual([
      winnerOne,
      winnerTwo,
    ]);
  });
});
