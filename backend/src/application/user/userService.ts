import { EntityManager } from 'typeorm';
import { logger } from '../../api/helpers/logger';
import { SubmissionType, TransactionStatus } from '../../domain/entities/enums';
import { FraudAttempt } from '../../domain/entities/fraudAttempt';
import { Submission } from '../../domain/entities/submission';
import { User } from '../../domain/entities/user';
import { GameSessionService } from '../../domain/service/gameSessionService';
import { UserDomainService } from '../../domain/service/userDomainService';
import {
  numberOfFraudAttemptsDetected,
  numberOfValidSessions,
} from '../../infra/monitoring/metrics';
import { ADMIN_PRIVATE_KEY } from '../../shared/constants';
import {
  FraudReason,
  GameSession,
  SessionValidationDebug,
} from '../../shared/types';
import { DailyStreakChallengeNotFoundError } from '../errors/streakErrors';
import {
  NicknameNotProvidedError,
  UserNotFoundError,
} from '../errors/userErrors';
import { TransactionClientPort } from '../ports/transactionClientPort';
import { StreakService } from '../streaks/streakService';

export class UserService {
  constructor(
    private userDomainService: UserDomainService,
    private streakService: StreakService,
    private gameSessionService: GameSessionService,
    private transactionClient: TransactionClientPort,
    private entityManager: EntityManager,
  ) {}

  async loginOrRegister(
    googleId: string,
    nickName?: string,
    photoUri?: string,
    referralCode?: string,
  ): Promise<{
    user: User;
    isNewUser: boolean;
  }> {
    const existingUser = await this.entityManager.getRepository(User).findOne({
      where: { googleId },
    });

    if (existingUser) {
      return {
        user: existingUser,
        isNewUser: false,
      };
    }

    if (!nickName) {
      throw new NicknameNotProvidedError();
    }
    const referrer = referralCode
      ? (await this.entityManager
          .getRepository(User)
          .findOne({ where: { referralCode } })) || undefined
      : undefined;
    const user = this.userDomainService.createUser(
      googleId,
      nickName,
      photoUri,
      referrer,
    );
    if (referralCode && !referrer) {
      logger.warn({
        msg: `invalid referral code ${referralCode} the referrer was not found!`,
      });
    }
    if (referrer && referrer.googleId !== googleId) {
      await this.entityManager.transaction(async (manager) => {
        this.userDomainService.addReferrerBonus(referrer);
        await manager.save(user);
        await manager.save(referrer);
      });
    } else {
      await this.entityManager.save(user);
    }
    return {
      user,
      isNewUser: true,
    };
  }

  async validateSessionAndAwardPoints(
    userId: number,
    gameSession: GameSession,
    options?: { debug?: boolean },
  ): Promise<{
    sessionScore: number;
    pointsEarned: number;
    totalPoints: number;
    isFraud: boolean;
    fraudReason: FraudReason;
    debug?: SessionValidationDebug;
  }> {
    return await this.entityManager.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        relations: ['items', 'fraudAttempts'],
      });
      if (!user) {
        throw new UserNotFoundError(
          `Invalid id, user with id ${userId} not found`,
        );
      }
      user.updateBlacklistStatus();
      if (user.isBlackListed) {
        return {
          sessionScore: 0,
          pointsEarned: 0,
          totalPoints: user.points,
          isFraud: false,
          fraudReason: FraudReason.USER_BLACK_LISTED,
        };
      }

      const dailyChallenge = await this.streakService.getDailyStreak();
      if (!dailyChallenge) {
        throw new DailyStreakChallengeNotFoundError();
      }

      const debugEnabled = options?.debug === true;
      let sessionResult: {
        score: number;
        streakChallengeCompleted: boolean;
        blocksPassed: number;
        isFraud: boolean;
        fraudReason: FraudReason;
        debug?: SessionValidationDebug;
      };
      if (debugEnabled) {
        sessionResult = this.gameSessionService.validateSessionWithDebug(
          user,
          gameSession,
          dailyChallenge,
          ADMIN_PRIVATE_KEY,
        );
      } else {
        sessionResult = this.gameSessionService.validateSession(
          user,
          gameSession,
          dailyChallenge,
          ADMIN_PRIVATE_KEY,
        );
      }
      const { score, streakChallengeCompleted, isFraud, fraudReason, debug } =
        sessionResult;

      let pointsEarned = 0;
      if (
        !isFraud &&
        fraudReason !== FraudReason.INVALID_DATA &&
        fraudReason !== FraudReason.INVALID_ITEM
      ) {
        pointsEarned = this.userDomainService.increaseUserPoints(user, score);
        if (streakChallengeCompleted) {
          user.increaseStreak();
        }
      } else {
        const fraudAttempt = new FraudAttempt();
        fraudAttempt.fraudReason = fraudReason;
        fraudAttempt.fraudData = gameSession;
        fraudAttempt.user = user;
        user.addFraudAttempt(fraudAttempt);
      }

      const updatedUser = await manager.save(user);

      if (isFraud) {
        numberOfFraudAttemptsDetected.inc();
      } else {
        numberOfValidSessions.inc();
      }

      return {
        sessionScore: score,
        pointsEarned,
        totalPoints: updatedUser.points,
        isFraud,
        fraudReason,
        debug,
      };
    });
  }

  async generateRandomSeed(): Promise<{ seed: string; signature: string }> {
    return this.gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
  }

  async signSeed(seed: string): Promise<string> {
    return this.gameSessionService.signSeed(seed, ADMIN_PRIVATE_KEY);
  }

  async getActiveReferrals(userId: number): Promise<User[]> {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['referees'],
    });

    if (!user) {
      throw new UserNotFoundError(
        `Invalid id, user with id ${userId} not found`,
      );
    }

    // Return only active (not blacklisted) referrals
    return (user.referees || []).filter((referee) => !referee.isBlackListed);
  }

  async getUserProfile(userId: number): Promise<User> {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['items'],
    });

    if (!user) {
      throw new UserNotFoundError(
        `Invalid id, user with id ${userId} not found`,
      );
    }

    return user;
  }

  async getDailySubmissionsLeft(userId: number): Promise<{
    dailyRaffleSubmissionsLeft: number;
    dailyWeeklyContestSubmissionsLeft: number;
  }> {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['submissions'],
    });
    if (!user) {
      throw new UserNotFoundError(
        `Invalid id, user with id ${userId} not found`,
      );
    }
    const dailyRaffleSubmissions = user.submissions.filter((submission) => {
      return (
        submission.type === SubmissionType.Raffle &&
        submission.isSponsored &&
        submission.createdAt.toISOString().slice(0, 10) ===
          new Date().toISOString().slice(0, 10)
      );
    });
    const dailyWeeklyContestSubmissions = user.submissions.filter(
      (submission) => {
        return (
          submission.type === SubmissionType.WeeklyContest &&
          submission.isSponsored &&
          submission.createdAt.toISOString().slice(0, 10) ===
            new Date().toISOString().slice(0, 10)
        );
      },
    );
    return {
      dailyRaffleSubmissionsLeft: 3 - dailyRaffleSubmissions.length,
      dailyWeeklyContestSubmissionsLeft:
        3 - dailyWeeklyContestSubmissions.length,
    };
  }

  async getCurrentTournamentSubmissions(userId: number): Promise<{
    weeklyContestSubmissionsForCurrentTournament: Submission[];
    raffleSubmissionsForCurrentTournament: Submission[];
  }> {
    const tournamentId = await this.transactionClient.getTournamentId();
    const submission = await this.entityManager.find(Submission, {
      where: {
        user: {
          id: userId,
        },
        tournamentId,
        transactionStatus: TransactionStatus.Success,
      },
    });
    return {
      weeklyContestSubmissionsForCurrentTournament: submission.filter(
        (submission) => submission.type === SubmissionType.WeeklyContest,
      ),
      raffleSubmissionsForCurrentTournament: submission.filter(
        (submission) => submission.type === SubmissionType.Raffle,
      ),
    };
  }

  async isNewUser(googleId: string): Promise<boolean> {
    const user = await this.entityManager.findOne(User, {
      where: { googleId },
    });
    if (!user) {
      return true;
    }
    return false;
  }
}
