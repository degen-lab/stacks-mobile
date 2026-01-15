import { BaseAppEntity } from './baseAppEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { SubmissionType, TransactionStatus } from './enums';
import { User } from './user';
import { SubmissionTier } from '../helpers/types';
import { InvalidStacksAddressError } from '../errors/submissionError';

@Entity()
export class Submission extends BaseAppEntity {
  @Column({ type: 'text', nullable: true })
  transactionId?: string;
  @Column({ type: 'enum', enum: SubmissionType })
  type: SubmissionType;
  @Column({ type: 'text' })
  stacksAddress: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  @Column({ type: 'integer' })
  score: number;
  @Column({ type: 'integer' })
  tournamentId: number;
  @Column({ type: 'enum', enum: SubmissionTier, default: SubmissionTier.None })
  tier: SubmissionTier;
  @ManyToOne(() => User, (user) => user.submissions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.NotBroadcasted,
  })
  transactionStatus: TransactionStatus;
  @Column({ type: 'text', nullable: true })
  serializedTx?: string;
  @Column({ type: 'bool', default: false })
  adWatched: boolean;
  @Column({ type: 'bool', default: false })
  isSponsored: boolean;
  /**
   * Invariant: Validates that the Stacks address is valid.
   * Valid Stacks addresses:
   * - Start with 'ST' (testnet), 'SP' (mainnet), or 'SM' (contract)
   * - Are 40 or 41 characters long
   * - Use c32check encoding (alphanumeric: A-Z, 0-9)
   * Throws InvalidStacksAddressError if the address is invalid.
   */
  validateStacksAddressInvariant(address: string): void {
    if (!address || typeof address !== 'string') {
      throw new InvalidStacksAddressError(
        `Invalid Stacks address: address must be a non-empty string`,
      );
    }

    const validPrefixes = ['ST', 'SP', 'SM'];
    const hasValidPrefix = validPrefixes.some((prefix) =>
      address.startsWith(prefix),
    );

    if (!hasValidPrefix) {
      throw new InvalidStacksAddressError(
        `Invalid Stacks address: ${address}. Address must start with 'ST' (testnet), 'SP' (mainnet), or 'SM' (contract)`,
      );
    }

    if (address.length !== 40 && address.length !== 41) {
      throw new InvalidStacksAddressError(
        `Invalid Stacks address: ${address}. Address must be 40 or 41 characters long, got ${address.length}`,
      );
    }

    // Validate that the address uses alphanumeric characters (A-Z, 0-9) after the prefix
    // Stacks uses c32check encoding which includes all digits and uppercase letters
    const addressPattern = /^(ST|SP|SM)[A-Z0-9]{38,39}$/;
    if (!addressPattern.test(address)) {
      throw new InvalidStacksAddressError(
        `Invalid Stacks address: ${address}. Address contains invalid characters. Stacks addresses use c32check encoding (A-Z, 0-9) after the prefix`,
      );
    }
  }
}
