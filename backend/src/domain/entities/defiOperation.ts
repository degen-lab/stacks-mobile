import { BaseAppEntity } from "./baseAppEntity";
import { Column, Entity, ManyToOne } from "typeorm";
import { DefiOperationType, TransactionStatus } from "./enums";
import { User } from "./user";
import { DefiOperationMetadata } from "../helpers/types";
@Entity()
export class DefiOperation extends BaseAppEntity {
  @Column({ type: 'text' })
  senderAddress: string;
  @Column({ type: 'text', unique: true, nullable: true })
  txId?: string;
  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;
  @Column({ type: 'enum', enum: DefiOperationType })
  operationType: DefiOperationType;
  @Column({ type: 'jsonb', nullable: true })
  metadata: DefiOperationMetadata;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
  createdAt: Date;
  @ManyToOne(() => User, (user) => user.defiOperationList, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user:User;
}
