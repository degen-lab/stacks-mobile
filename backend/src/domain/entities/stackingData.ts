import { BaseAppEntity } from './baseAppEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { TransactionStatus } from './enums';
import { User } from './user';

@Entity()
export class StackingData extends BaseAppEntity {
  @Column({ type: 'int' })
  startCycleId: number;
  @Column({ type: 'text' })
  poolName: string;
  @Column({ type: 'text' })
  poolStxAddress: string;
  @Column({ type: 'text' })
  userStxAddress: string;
  @Column({ type: 'decimal', precision: 20, scale: 6 })
  amountOfStxStacked: number;
  @Column({ type: 'int', nullable: true })
  endCycleId: number | null;
  @Column({ type: 'text', unique: true })
  txId: string;
  @Column({ type: 'text', nullable: true })
  poxAddress: string | null;
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.Pending,
  })
  txStatus: TransactionStatus;
  @Column({ type: 'bigint', nullable: true })
  rewardedStxAmount: number | null;
  @ManyToOne(() => User, (user) => user.stackingData, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
}
