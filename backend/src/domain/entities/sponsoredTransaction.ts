import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Submission } from './submission';
import { User } from './user';
import { TransactionStatus } from './enums';

@Entity({ name: 'sponsored_transaction' })
export class SponsoredTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sponsoredTransactions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;

  @OneToOne(() => Submission, (submission) => submission.sponsoredTransaction, {
    nullable: true,
  })
  submission?: Submission | null;

  @Column({ type: 'text', nullable: true })
  serializedTx?: string | null;

  @Column({ type: 'text', nullable: true })
  txId?: string | null;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.NotBroadcasted,
  })
  status: TransactionStatus;

  @Column({ type: 'bool', default: false })
  adWatched: boolean;

  @Column({ type: 'text' })
  originAddress: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
