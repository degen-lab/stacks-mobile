import { BaseAppEntity } from "./baseAppEntity";
import { Column, Entity, ManyToOne } from "typeorm";
import { TransactionStatus } from "./enums";
import { User } from "./user";

@Entity()
export class StackingData extends BaseAppEntity {
  @Column({ type: 'number' })
  startCycleId: number;
  @Column({ type: 'text' })
  poolName: string;
  @Column({ type: 'text' })
  poolAddress: string;
  @Column({ type: 'text' })
  userAddress: string;
  @Column({ type: 'number' })
  amountOfStx: number;
  @Column({ type: 'int', nullable: true })
  endCycleId: number | null;
  @Column({ type: 'text' })
  txId: string;
  @Column({ type: 'text', nullable: true })
  poxAddress: string | null;
  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.Pending })
  txStatus: TransactionStatus;
  @ManyToOne(() => User, (user) => user.stackingData, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  user: User;
}
