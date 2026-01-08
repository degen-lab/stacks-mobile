import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/infra/db/dataSource';
import { User } from '../src/domain/entities/user';
import { Submission } from '../src/domain/entities/submission';
import { SubmissionDomainService } from '../src/domain/service/submissionDomainService';
import { TransactionClient } from '../src/infra/stacks/transactionClient';
import {
  SubmissionType,
  TransactionStatus,
} from '../src/domain/entities/enums';
import { logger } from '../src/api/helpers/logger';

const PHOTO_URL =
  'https://fastly.picsum.photos/id/237/536/354.jpg?hmac=i0yVXW1ORpyCZpQ-CknuyV-jbtU7_x9EBQVhvT5aRr0';

export const stxAddresses = [
  'SPTW2TSW6XW8G1Q6TS84R49PJGCD7BBHS3P1R4C3',
  'SP31CA5BZ5SY6P08S2T27B044SHGH2KPHT9K7CVX1',
  'SP09H5WY4CDYTQDTBS2MS6RXEHWYPZKEFXTS5TVH',
  'SPN5S0ZK5F26126AAMXKNMCS8DFFPZSTCN672XCT',
  'SPN74BJSW1ZVDDYETTYEG040S04TVV2RRR6P371F',
  'SP31E6MYYCQCRZWT6PFMDV0Z8T4DGJNEH630TZSY3',
  'SP1Q635NTPVGCQSCPQQ63GQM0RX90CCJ6KGCJD6ZP',
  'SP33TSSWS63NX8RVWGRKPYC761WRZWSK4DHS78V7R',
  'SP1V4EDHQTQ70M6M36D4BV1CPB9EXHY5NGG56XJYC',
  'SP14TTEXWV7GGKBN4DD3TDE2HS9W3VRZW3Y2R25KD',
];

const DEMO_USERS = [
  { nickName: 'Player1', score: 5000 },
  { nickName: 'Player2', score: 4500 },
  { nickName: 'Player3', score: 4000 },
  { nickName: 'Player4', score: 3500 },
  { nickName: 'Player5', score: 3000 },
  { nickName: 'Player6', score: 2500 },
  { nickName: 'Player7', score: 2000 },
  { nickName: 'Player8', score: 1800 },
  { nickName: 'Player9', score: 1500 },
  { nickName: 'Player10', score: 1000 },
];

async function seedLeaderboard() {
  let dataSource: DataSource | null = null;

  try {
    logger.info('Initializing database connection...');
    dataSource = await AppDataSource.initialize();
    logger.info('Database connected successfully');

    const entityManager = dataSource.createEntityManager();
    const transactionClient = new TransactionClient();

    logger.info('Getting current tournament ID...');
    const tournamentId = await transactionClient.getTournamentId();
    logger.info(`Current tournament ID: ${tournamentId}`);
    const demoNickNames = DEMO_USERS.map((u) => u.nickName);
    const existingDemoUsers = await entityManager
      .createQueryBuilder(User, 'user')
      .where('user.nickName IN (:...nickNames)', { nickNames: demoNickNames })
      .getMany();

    // Check existing submissions for current tournament
    const existingSubmissions = await entityManager.find(Submission, {
      where: {
        tournamentId,
        type: SubmissionType.WeeklyContest,
        transactionStatus: TransactionStatus.Success,
      },
      relations: ['user'],
    });

    // If we have all demo users with submissions, skip
    if (
      existingDemoUsers.length === DEMO_USERS.length &&
      existingSubmissions.length >= DEMO_USERS.length
    ) {
      logger.info(
        `Found ${existingDemoUsers.length} demo users with ${existingSubmissions.length} submissions for tournament ${tournamentId}`,
      );
      logger.info('Leaderboard already fully seeded. Skipping...');
      await dataSource.destroy();
      return;
    }

    // If we have partial data, clean it up first
    if (existingDemoUsers.length > 0 || existingSubmissions.length > 0) {
      logger.info(
        `Found partial data: ${existingDemoUsers.length} users, ${existingSubmissions.length} submissions. Cleaning up...`,
      );

      // Delete existing submissions for demo users
      if (existingSubmissions.length > 0) {
        const demoUserIds = existingDemoUsers.map((u) => u.id);
        if (demoUserIds.length > 0) {
          // Delete submissions by user IDs using query builder with In operator
          const submissionMetadata =
            entityManager.connection.getMetadata(Submission);
          const userColumn =
            submissionMetadata.findColumnWithPropertyName('user');
          const userIdColumnName = userColumn?.databaseName || 'userId';

          await entityManager
            .createQueryBuilder()
            .delete()
            .from(Submission)
            .where(`"${userIdColumnName}" IN (:...userIds)`, {
              userIds: demoUserIds,
            })
            .andWhere('tournamentId = :tournamentId', { tournamentId })
            .execute();
        } else {
          // If no demo users but submissions exist, delete by tournament
          await entityManager.delete(Submission, {
            tournamentId,
          });
        }
        logger.info(
          `Deleted ${existingSubmissions.length} existing submissions`,
        );
      }

      // Delete existing demo users
      if (existingDemoUsers.length > 0) {
        await entityManager.remove(existingDemoUsers);
        logger.info(`Deleted ${existingDemoUsers.length} existing demo users`);
      }
    }

    const submissionDomainService = new SubmissionDomainService();
    const createdUsers: User[] = [];

    // Create users and submissions
    logger.info(`Creating ${DEMO_USERS.length} demo users and submissions...`);

    for (let i = 0; i < DEMO_USERS.length; i++) {
      const demoUser = DEMO_USERS[i];
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const googleId = `demo-user-${timestamp}-${i}-${randomSuffix}`;
      const stacksAddress = stxAddresses[i];

      // Create user
      const user = new User();
      user.googleId = googleId;
      user.nickName = demoUser.nickName;
      user.photoUri = PHOTO_URL;
      user.points = Math.floor(demoUser.score * 0.1); // Calculate points from score
      user.streak = Math.floor(Math.random() * 10); // Random streak

      // Generate unique referral code - use a combination that ensures uniqueness
      // Format: First 4 chars of hex(timestamp) + 2 chars of hex(index) + 2 random hex chars
      const timestampHex = timestamp.toString(16).slice(-8).toUpperCase();
      const indexHex = i.toString(16).padStart(2, '0').toUpperCase();
      const randomHex = Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();
      let referralCode = (timestampHex.slice(-4) + indexHex + randomHex).slice(
        0,
        8,
      );

      // Ensure referral code is unique by checking database
      let existingUser = await entityManager.findOne(User, {
        where: { referralCode },
      });
      let attempts = 0;
      while (existingUser && attempts < 50) {
        // Generate new unique code with different random component
        const newRandom = Math.floor(Math.random() * 65536)
          .toString(16)
          .padStart(4, '0')
          .toUpperCase();
        referralCode = (timestampHex.slice(-4) + indexHex + newRandom).slice(
          0,
          8,
        );
        existingUser = await entityManager.findOne(User, {
          where: { referralCode },
        });
        attempts++;
      }

      if (existingUser) {
        throw new Error(
          `Failed to generate unique referral code after ${attempts} attempts for user ${demoUser.nickName}`,
        );
      }

      user.referralCode = referralCode;
      user.isBlackListed = false;

      const savedUser = await entityManager.save(user);
      createdUsers.push(savedUser);

      // Create submission
      const submission = submissionDomainService.createSubmission(
        stacksAddress,
        demoUser.score,
        tournamentId,
        SubmissionType.WeeklyContest,
        savedUser,
        false, // isSponsored
      );

      // Set transaction status to Success so it appears in leaderboard
      submission.transactionStatus = TransactionStatus.Success;
      submission.transactionId = `demo-tx-${Date.now()}-${i}`;

      await entityManager.save(submission);

      logger.info(
        `Created user "${demoUser.nickName}" with score ${demoUser.score}`,
      );
    }

    logger.info(
      `Successfully created ${createdUsers.length} users with submissions!`,
    );

    // Verify leaderboard
    const submissions = await entityManager.find(Submission, {
      where: {
        tournamentId,
        type: SubmissionType.WeeklyContest,
        transactionStatus: TransactionStatus.Success,
      },
      relations: ['user'],
      order: { score: 'DESC' },
    });

    logger.info(`\n=== Leaderboard Summary ===`);
    logger.info(`Total submissions in leaderboard: ${submissions.length}`);
    logger.info(`\nTop 10 players:`);
    submissions.slice(0, 10).forEach((sub, index) => {
      logger.info(
        `${index + 1}. ${sub.user.nickName} - Score: ${sub.score} - Points: ${sub.user.points}`,
      );
    });

    await dataSource.destroy();
    logger.info('\nSeed completed successfully!');
  } catch (error) {
    logger.error({
      msg: 'Error seeding leaderboard',
      err: error,
    });
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the seed script
seedLeaderboard();
