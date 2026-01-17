import { BaseAppEntity } from "./baseAppEntity";
import { Column, Entity } from "typeorm";
import { TransactionStatus } from "./enums";

@Entity()
export class StackingData extends BaseAppEntity {
  @Column({ type: 'text' })
  cycleId: string;
  @Column({ type: 'text' })
  poolName: string;
  @Column({ type: 'text' })
  poolAddress: string;
  @Column({ type: 'text' })
  userAddress: string;
  @Column({ type: 'number' })
  amountOfStx: number;
  @Column({ type: 'int' })
  numberOfCycles: number;
  @Column({ type: 'text' })
  txId: string;
  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.Pending })
  txStatus: TransactionStatus;
}
