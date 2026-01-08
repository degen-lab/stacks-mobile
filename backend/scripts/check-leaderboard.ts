import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/infra/db/dataSource';
import { User } from '../src/domain/entities/user';
import { Submission } from '../src/domain/entities/submission';
import { TransactionClient } from '../src/infra/stacks/transactionClient';
import {
  SubmissionType,
  TransactionStatus,
} from '../src/domain/entities/enums';
import { logger } from '../src/api/helpers/logger';

async function checkLeaderboard() {
  let dataSource: DataSource | undefined;

  try {
    // Initialize database connection
    logger.info('Initializing database connection...');
    dataSource = await AppDataSource.initialize();
    logger.info('Database connected successfully');

    const entityManager = dataSource.createEntityManager();
    const transactionClient = new TransactionClient();

    // Get current tournament ID
    const tournamentId = await transactionClient.getTournamentId();
    logger.info(`Current tournament ID: ${tournamentId}`);

    // Get all users
    const users = await entityManager.find(User, {
      order: { createdAt: 'DESC' },
      take: 20,
    });

    logger.info(`\n=== Database Summary ===`);
    logger.info(`Total users (showing last 20): ${users.length}`);

    if (users.length > 0) {
      logger.info(`\nRecent users:`);
      users.forEach((user, index) => {
        logger.info(
          `${index + 1}. ${user.nickName} (ID: ${user.id}) - Points: ${user.points} - Streak: ${user.streak}`,
        );
      });
    }

    // Get all submissions for current tournament
    const submissions = await entityManager.find(Submission, {
      where: {
        tournamentId,
        type: SubmissionType.WeeklyContest,
      },
      relations: ['user'],
      order: { score: 'DESC' },
    });

    logger.info(`\n=== Submissions Summary ===`);
    logger.info(
      `Total submissions for tournament ${tournamentId}: ${submissions.length}`,
    );

    // Group by status
    const byStatus = submissions.reduce(
      (acc, sub) => {
        acc[sub.transactionStatus] = (acc[sub.transactionStatus] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    logger.info(`\nSubmissions by status:`);
    Object.entries(byStatus).forEach(([status, count]) => {
      logger.info(`  ${status}: ${count}`);
    });

    // Get successful submissions (those that appear in leaderboard)
    const successfulSubmissions = submissions.filter(
      (sub) => sub.transactionStatus === TransactionStatus.Success,
    );

    logger.info(`\n=== Leaderboard (Success Status Only) ===`);
    logger.info(
      `Total submissions in leaderboard: ${successfulSubmissions.length}`,
    );

    if (successfulSubmissions.length > 0) {
      logger.info(`\nTop players:`);
      successfulSubmissions.slice(0, 15).forEach((sub, index) => {
        logger.info(
          `${index + 1}. ${sub.user.nickName} - Score: ${sub.score} - Points: ${sub.user.points} - Status: ${sub.transactionStatus}`,
        );
      });
    } else {
      logger.info(
        '\n⚠️  No successful submissions found! Run "pnpm seed:leaderboard" to add demo data.',
      );
    }

    // Check for users without submissions
    const usersWithoutSubmissions = await entityManager
      .createQueryBuilder(User, 'user')
      .leftJoin(
        'user.submissions',
        'submission',
        'submission.tournamentId = :tournamentId',
        {
          tournamentId,
        },
      )
      .where('submission.id IS NULL')
      .getMany();

    if (usersWithoutSubmissions.length > 0) {
      logger.info(
        `\n⚠️  Found ${usersWithoutSubmissions.length} users without submissions for tournament ${tournamentId}`,
      );
    }

    await dataSource.destroy();
  } catch (error) {
    logger.error({
      msg: 'Error checking leaderboard',
      err: error,
    });
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the check script
checkLeaderboard();
