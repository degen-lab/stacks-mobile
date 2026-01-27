import { BaseAppEntity } from "./baseAppEntity";
import { Column, Entity, ManyToOne } from "typeorm";
import { DefiOperationType, TransactionStatus } from "./enums";
import { User } from "./user";
@Entity()
export class DefiOperation extends BaseAppEntity {
  @Column({ type: 'text' })
  txId: string;
  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;
  @Column({ type: 'enum', enum: DefiOperationType })
  operationType: DefiOperationType;
  @Column({ type: 'jsonb' })
  metadata: DefiOperationType;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
  createdAt: Date;
  @ManyToOne(() => User, (user) => user.defiOperationList, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user:User;
}
