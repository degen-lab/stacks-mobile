import { logger } from '../../../api/helpers/logger';
import { TransactionService } from '../../../application/transaction/transactionService';

export class TransactionWorker {
  private isRunning = false;
  private shouldStop = false;
  private pollIntervalMs = 25000; // 25 seconds between iterations (for testing)

  constructor(private transactionService: TransactionService) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Transaction worker is already running');
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;
    logger.info('Transaction worker started - polling for batches');

    // Start the polling loop
    this.pollLoop().catch((error) => {
      logger.error({
        msg: 'Fatal error in transaction worker polling loop',
        err: error,
      });
      this.isRunning = false;
    });
  }

  private async pollLoop(): Promise<void> {
    while (!this.shouldStop) {
      try {
        logger.info('Processing batch of transactions...');
        await this.transactionService.broadcastBatchTransactions();
        logger.info('Batch processing completed');

        // Wait before next iteration
        logger.info(
          `Waiting ${this.pollIntervalMs / 1000}s before next batch check...`,
        );
        await this.sleep(this.pollIntervalMs);
      } catch (error) {
        logger.error({
          msg: 'Error processing batch of transactions',
          err: error,
        });
        // Continue polling even if there's an error
        // Wait a bit before retrying to avoid tight error loops
        await this.sleep(30000); // 30 seconds on error
      }
    }

    this.isRunning = false;
    logger.info('Transaction worker polling loop stopped');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async stop(): Promise<void> {
    logger.info('Stopping transaction worker...');
    this.shouldStop = true;

    // Wait for the loop to finish (with timeout)
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();
    while (this.isRunning && Date.now() - startTime < maxWaitTime) {
      await this.sleep(100);
    }

    if (this.isRunning) {
      logger.warn('Transaction worker did not stop gracefully');
    } else {
      logger.info('Transaction worker stopped successfully');
    }
  }
}
