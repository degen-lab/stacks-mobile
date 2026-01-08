import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/api/server';
import {
  cleanTestDatabase,
  closeTestDataSource,
  createTestDataSource,
  getTestDataSource,
} from './testDataSource';
import { User } from '../../src/domain/entities/user';
import { Submission } from '../../src/domain/entities/submission';
import {
  SubmissionType,
  TransactionStatus,
  TournamentStatusEnum,
} from '../../src/domain/entities/enums';
import { TournamentStatus } from '../../src/domain/entities/tournamentStatus';

const validAddress = `ST2CY5V3NHDPWSXMWQDT3HC3GD6Q6XX4CFRKAG`
  .padEnd(41, 'A')
  .substring(0, 41);

describe('API routes smoke tests', () => {
  let app: FastifyInstance;

  const auth = async (googleId: string, nickName: string) => {
    const res = await app.inject({
      method: 'POST',
      url: '/user/auth',
      payload: { googleId, nickName },
    });
    const body = JSON.parse(res.body);
    return body.token as string;
  };

  beforeAll(async () => {
    await createTestDataSource();
    const ds = getTestDataSource();
    app = await buildServer(ds);
    await app.ready();
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await closeTestDataSource();
  });

  it('GET /user/sponsored-submissions-left should return remaining limits', async () => {
    const token = await auth(
      'sponsored-left-user-12345678901234567890',
      'SubLeftUser',
    );
    const ds = getTestDataSource();
    const em = ds.createEntityManager();
    const user = await em.findOne(User, {
      where: { googleId: 'sponsored-left-user-12345678901234567890' },
    });
    // Seed one sponsored raffle and one sponsored weekly submission for today
    const raffle = new Submission();
    raffle.stacksAddress = validAddress;
    raffle.score = 50;
    raffle.tournamentId = 1;
    raffle.type = SubmissionType.Raffle;
    raffle.transactionStatus = TransactionStatus.NotBroadcasted;
    raffle.isSponsored = true;
    raffle.user = user as User;
    const weekly = new Submission();
    weekly.stacksAddress = validAddress;
    weekly.score = 60;
    weekly.tournamentId = 1;
    weekly.type = SubmissionType.WeeklyContest;
    weekly.transactionStatus = TransactionStatus.NotBroadcasted;
    weekly.isSponsored = true;
    weekly.user = user as User;
    await em.save([raffle, weekly]);

    const response = await app.inject({
      method: 'GET',
      url: '/user/sponsored-submissions-left',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.dailyRaffleSubmissionsLeft).toBe(2); // 3 max - 1 seeded
    expect(body.data.dailyWeeklyContestSubmissionsLeft).toBe(2); // 3 max - 1 seeded
  });

  it('DELETE /transaction/:id should delete a not-broadcasted submission for the user', async () => {
    const token = await auth('delete-user-12345678901234567890', 'DeleteUser');
    const ds = getTestDataSource();
    const em = ds.createEntityManager();

    const user = await em.findOne(User, {
      where: { googleId: 'delete-user-12345678901234567890' },
    });
    const submission = new Submission();
    submission.stacksAddress = validAddress;
    submission.score = 100;
    submission.tournamentId = 1;
    submission.type = SubmissionType.WeeklyContest;
    submission.transactionStatus = TransactionStatus.NotBroadcasted;
    submission.isSponsored = false;
    submission.user = user as User;
    await em.save(submission);

    const response = await app.inject({
      method: 'DELETE',
      url: `/transaction/${submission.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);

    const deleted = await em.findOne(Submission, {
      where: { id: submission.id },
    });
    expect(deleted).toBeNull();
  });

  it('GET /tournament/tournament-data should return current tournament status', async () => {
    const token = await auth(
      'tournament-user-12345678901234567890',
      'TournamentUser',
    );
    const ds = getTestDataSource();
    const em = ds.createEntityManager();
    const status = new TournamentStatus();
    status.tournamentId = 42;
    status.status = TournamentStatusEnum.SubmitPhase;
    await em.save(status);

    const response = await app.inject({
      method: 'GET',
      url: '/tournament/tournament-data',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(Number(body.data.tournamentId)).toBe(42);
    expect(body.data.status).toBe('SubmitPhase');
  });
});
