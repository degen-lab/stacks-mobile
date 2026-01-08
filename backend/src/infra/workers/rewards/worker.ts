import { Job, Worker } from 'bullmq';
import { RewardsService } from '../../../application/rewards/rewardsService';
import { redis } from '../../redis/redisClient';
import { logger } from '../../../api/helpers/logger';
import { TournamentStatusEnum } from '../../../domain/entities/enums';

export class RewardsWorker {
  private worker: Worker;
  private pendingCheckIntervalMs = 10000; // 10 seconds when waiting for pending submissions

  constructor(private rewardsService: RewardsService) {
    this.worker = new Worker('rewards', this.handleJob.bind(this), {
      connection: redis,
      concurrency: 1,
      lockDuration: 3600000, // 1 hour - max time a job can be locked
      maxStalledCount: 1, // Max times a job can be stalled before failing
    });
  }

  private async handleJob(job: Job) {
    try {
      logger.info(`Handling job: ${job.name} (ID: ${job.id})`);
      switch (job.name) {
        case 'processTournamentCycle': {
          await this.processTournamentCycle();
          logger.info(`Job ${job.id}: Tournament cycle processed successfully`);
          break;
        }
        default: {
          logger.error(`Unknown job name: ${job.name}`);
          throw new Error(`Unknown job name: ${job.name}`);
        }
      }
    } catch (error) {
      logger.error({
        msg: `Error handling job ${job.name} (ID: ${job.id})`,
        err: error,
        jobId: job.id,
        jobName: job.name,
      });
      throw error;
    }
  }

  private async processTournamentCycle() {
    const tournamentStatus =
      await this.rewardsService.getCurrentTournamentStatus();

    if (!tournamentStatus) {
      throw new Error('No tournament status found');
    }

    logger.info({
      msg: 'Starting tournament cycle',
      tournamentId: tournamentStatus.tournamentId,
      status: tournamentStatus.status,
    });

    if (tournamentStatus.status === TournamentStatusEnum.HeadToNextTournament) {
      logger.info({
        msg: 'Tournament is already in HeadToNextTournament phase, completing cycle',
        tournamentId: tournamentStatus.tournamentId,
      });

      const currentTournamentId = tournamentStatus.tournamentId;

      const blockchainTournamentId =
        await this.rewardsService.getBlockchainTournamentId();

      if (blockchainTournamentId === currentTournamentId) {
        logger.warn({
          msg: 'Tournament ID on blockchain has not changed yet - transaction may not have anchored. Proceeding with reset anyway.',
          currentTournamentId,
          blockchainTournamentId,
        });
      } else {
        logger.info({
          msg: 'Tournament ID on blockchain has changed, transaction anchored',
          oldTournamentId: currentTournamentId,
          newTournamentId: blockchainTournamentId,
        });
      }

      logger.info({
        msg: 'Cleaning up unsuccessful submissions for previous tournament',
        tournamentId: currentTournamentId,
      });
      await this.rewardsService.cleanupUnsuccessfulSubmissions(
        currentTournamentId,
      );

      logger.info({
        msg: 'Resetting tournament status to SubmitPhase for next cycle',
      });

      await this.rewardsService.resetTournamentStatusToSubmitPhase();

      logger.info({
        msg: 'Tournament cycle completed successfully (recovered from HeadToNextTournament)',
        previousTournamentId: currentTournamentId,
      });

      return; // Exit early - cycle completed
    }

    // Step 1: If in SubmitPhase, advance to FinishSubmissionsPhase
    if (tournamentStatus.status === TournamentStatusEnum.SubmitPhase) {
      logger.info(
        'Tournament is in SubmitPhase, advancing to FinishSubmissionsPhase',
      );
      await this.rewardsService.advanceTournamentPhase();
    }

    // Step 2: Wait for all pending/processing submissions to complete
    // Refresh status after advancing
    const updatedStatus =
      await this.rewardsService.getCurrentTournamentStatus();
    if (!updatedStatus) {
      throw new Error('Tournament status not found after advancing phase');
    }

    const currentTournamentId = updatedStatus.tournamentId;

    // Wait for pending submissions to complete
    logger.info({
      msg: 'Waiting for transaction worker to finish all pending submissions',
      tournamentId: currentTournamentId,
    });

    while (true) {
      const pendingCount =
        await this.rewardsService.checkPendingSubmissionsCount(
          currentTournamentId,
        );

      if (pendingCount === 0) {
        logger.info({
          msg: 'All pending submissions completed',
          tournamentId: currentTournamentId,
        });
        break;
      }

      logger.info({
        msg: 'Waiting for pending submissions to complete',
        pendingCount,
        tournamentId: currentTournamentId,
      });
      await new Promise((resolve) =>
        setTimeout(resolve, this.pendingCheckIntervalMs),
      );
    }

    // Step 3: Advance to DistributionPhase
    logger.info({
      msg: 'Advancing to DistributionPhase',
      tournamentId: currentTournamentId,
    });
    await this.rewardsService.advanceTournamentPhase();

    // Step 4: Distribute rewards
    const finalStatus = await this.rewardsService.getCurrentTournamentStatus();
    if (!finalStatus) {
      throw new Error(
        'Tournament status not found after advancing to DistributionPhase',
      );
    }

    // Check if rewards distribution was already completed for this tournament
    const isDistributionCompleted =
      await this.rewardsService.isRewardsDistributionCompleted(
        currentTournamentId,
      );

    if (isDistributionCompleted) {
      logger.info({
        msg: 'Rewards distribution already completed for this tournament, skipping distribution',
        tournamentId: currentTournamentId,
      });
    } else {
      // Check if there are any successful submissions to distribute rewards for
      const successfulCount =
        await this.rewardsService.checkSuccessfulSubmissionsCount(
          currentTournamentId,
        );

      if (successfulCount === 0) {
        logger.info({
          msg: 'No successful submissions found, skipping distribution and tournament advancement',
          tournamentId: currentTournamentId,
        });
        // If no successful submissions, don't advance to next tournament
        // Just reset status back to SubmitPhase and wait for submissions
        await this.rewardsService.resetTournamentStatusToSubmitPhase();
        logger.info({
          msg: 'Tournament cycle skipped - no submissions to process',
          tournamentId: currentTournamentId,
        });
        return; // Exit early - don't proceed to headToNextTournament
      } else {
        logger.info({
          msg: 'Distributing rewards',
          tournamentId: currentTournamentId,
          successfulSubmissions: successfulCount,
        });

        // Retry distribution if transaction fails
        const maxRetries = 3;
        let retryCount = 0;
        let txId: string | null = null;
        let isAnchored = false;

        while (retryCount < maxRetries && !isAnchored) {
          try {
            // Delete previous failed transaction data if retrying
            if (retryCount > 0) {
              logger.info({
                msg: 'Retrying rewards distribution',
                tournamentId: currentTournamentId,
                attempt: retryCount + 1,
                maxRetries,
              });

              // Delete the previous failed rewards distribution data
              const previousTxId =
                await this.rewardsService.getLastDistributeRewardsTransactionId(
                  currentTournamentId,
                );
              if (previousTxId) {
                await this.rewardsService.deleteRewardsDistributionData(
                  previousTxId,
                );
              }
            }

            await this.rewardsService.distributeRewards();

            // Get the transaction ID after distribution
            txId =
              await this.rewardsService.getLastDistributeRewardsTransactionId(
                currentTournamentId,
              );

            if (txId) {
              logger.info({
                msg: 'Rewards distributed, waiting for transaction to anchor',
                transactionId: txId,
                tournamentId: currentTournamentId,
                attempt: retryCount + 1,
              });

              // Wait for transaction to anchor
              isAnchored =
                await this.rewardsService.waitForDistributeRewardsAnchored(
                  txId,
                  60000, // 1 minute max wait per attempt
                  10000, // 10 seconds poll interval
                );

              if (isAnchored) {
                logger.info({
                  msg: 'Distribute rewards transaction anchored',
                  transactionId: txId,
                  tournamentId: currentTournamentId,
                });

                // Distribute raffle rewards with retry (independent flow)
                {
                  const raffleMaxRetries = 3;
                  let raffleRetry = 0;
                  let raffleTxId: string | null = null;
                  let raffleAnchored = false;

                  while (raffleRetry < raffleMaxRetries && !raffleAnchored) {
                    try {
                      raffleTxId =
                        await this.rewardsService.distributeRaffleRewards();

                      if (raffleTxId) {
                        logger.info({
                          msg: 'Raffle rewards distributed, waiting for transaction to anchor',
                          transactionId: raffleTxId,
                          tournamentId: currentTournamentId,
                          attempt: raffleRetry + 1,
                        });

                        raffleAnchored =
                          await this.rewardsService.waitForDistributeRewardsAnchored(
                            raffleTxId,
                            60000,
                            10000,
                          );

                        if (raffleAnchored) {
                          logger.info({
                            msg: 'Raffle rewards transaction anchored',
                            transactionId: raffleTxId,
                            tournamentId: currentTournamentId,
                          });
                          break;
                        } else {
                          logger.warn({
                            msg: 'Raffle rewards transaction failed or timed out, will retry',
                            transactionId: raffleTxId,
                            tournamentId: currentTournamentId,
                            attempt: raffleRetry + 1,
                            maxRetries: raffleMaxRetries,
                          });
                          raffleRetry++;
                        }
                      } else {
                        // No winners, exit raffle loop
                        logger.info({
                          msg: 'No raffle winners to distribute rewards',
                          tournamentId: currentTournamentId,
                        });
                        break;
                      }
                    } catch (err) {
                      logger.error({
                        msg: 'Error during raffle rewards distribution, will retry',
                        tournamentId: currentTournamentId,
                        attempt: raffleRetry + 1,
                        maxRetries: raffleMaxRetries,
                        err,
                      });
                      raffleRetry++;
                    }

                    if (raffleRetry < raffleMaxRetries && !raffleAnchored) {
                      await new Promise((resolve) => setTimeout(resolve, 5000));
                    }
                  }

                  if (raffleRetry >= raffleMaxRetries && !raffleAnchored) {
                    logger.error({
                      msg: 'Raffle rewards distribution failed after retries',
                      tournamentId: currentTournamentId,
                      lastTransactionId: raffleTxId,
                    });
                  }
                }
                break;
              } else {
                logger.warn({
                  msg: 'Distribute rewards transaction failed or timed out, will retry',
                  transactionId: txId,
                  tournamentId: currentTournamentId,
                  attempt: retryCount + 1,
                  maxRetries,
                });
                retryCount++;
              }
            } else {
              logger.warn({
                msg: 'No transaction ID returned from distribution, will retry',
                tournamentId: currentTournamentId,
                attempt: retryCount + 1,
                maxRetries,
              });
              retryCount++;
            }
          } catch (error) {
            // Extract error details for better logging
            const errorDetails = {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : undefined,
              ...(error && typeof error === 'object' ? error : {}),
            };
            logger.error({
              msg: 'Error during rewards distribution, will retry',
              tournamentId: currentTournamentId,
              attempt: retryCount + 1,
              maxRetries,
              error: errorDetails,
            });
            retryCount++;
          }

          // Wait before retry
          if (retryCount < maxRetries && !isAnchored) {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds between retries
          }
        }

        if (!isAnchored) {
          throw new Error(
            `Distribute rewards failed after ${maxRetries} attempts. Last transaction ID: ${txId || 'none'}`,
          );
        }
      }
    }

    // Step 5: Go to next tournament (with retry logic)
    logger.info({
      msg: 'Heading to next tournament',
      previousTournamentId: currentTournamentId,
    });

    // Retry headToNextTournament if transaction fails
    const maxRetries = 3;
    let retryCount = 0;
    let nextTournamentTxId: string | null = null;
    let isAnchored = false;

    while (retryCount < maxRetries && !isAnchored) {
      try {
        nextTournamentTxId = await this.rewardsService.headToNextTournament();

        if (nextTournamentTxId) {
          logger.info({
            msg: 'Head to next tournament transaction broadcasted, waiting for it to anchor',
            transactionId: nextTournamentTxId,
            tournamentId: currentTournamentId,
            attempt: retryCount + 1,
          });

          // Wait for transaction to anchor
          isAnchored =
            await this.rewardsService.waitForHeadToNextTournamentAnchored(
              nextTournamentTxId,
              60000, // 1 minute max wait per attempt
              10000, // 10 seconds poll interval
            );

          if (isAnchored) {
            logger.info({
              msg: 'Head to next tournament transaction anchored',
              transactionId: nextTournamentTxId,
              tournamentId: currentTournamentId,
            });
            break;
          } else {
            logger.warn({
              msg: 'Head to next tournament transaction failed or timed out, will retry',
              transactionId: nextTournamentTxId,
              tournamentId: currentTournamentId,
              attempt: retryCount + 1,
              maxRetries,
            });
            retryCount++;
          }
        } else {
          logger.warn({
            msg: 'No transaction ID returned from headToNextTournament, will retry',
            tournamentId: currentTournamentId,
            attempt: retryCount + 1,
            maxRetries,
          });
          retryCount++;
        }
      } catch (error) {
        logger.error({
          msg: 'Error during headToNextTournament, will retry',
          tournamentId: currentTournamentId,
          attempt: retryCount + 1,
          maxRetries,
          error,
        });
        retryCount++;
      }

      // Wait before retry
      if (retryCount < maxRetries && !isAnchored) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds between retries
      }
    }

    if (!isAnchored) {
      throw new Error(
        `Head to next tournament failed after ${maxRetries} attempts. Last transaction ID: ${nextTournamentTxId || 'none'}`,
      );
    }

    // Step 5.5: Advance to HeadToNextTournament phase (transaction anchored successfully)
    logger.info({
      msg: 'Advancing to HeadToNextTournament phase',
      tournamentId: currentTournamentId,
    });
    await this.rewardsService.advanceTournamentPhase();

    // Step 6: Cleanup unsuccessful submissions for the previous tournament
    logger.info({
      msg: 'Cleaning up unsuccessful submissions for previous tournament',
      tournamentId: currentTournamentId,
    });
    await this.rewardsService.cleanupUnsuccessfulSubmissions(
      currentTournamentId,
    );

    // Step 7: Reset status to SubmitPhase for next cycle
    logger.info({
      msg: 'Resetting tournament status to SubmitPhase for next cycle',
    });

    await this.rewardsService.resetTournamentStatusToSubmitPhase();

    logger.info({
      msg: 'Tournament cycle completed successfully',
      previousTournamentId: currentTournamentId,
    });
  }

  async close() {
    await this.worker.close();
  }
}
