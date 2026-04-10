import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseAppEntity } from './baseAppEntity';
import { User } from './user';

export type ReportReason =
  | 'inappropriate_photo'
  | 'offensive_username'
  | 'other';

@Entity()
export class UserReport extends BaseAppEntity {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  reporter: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  reported: User;

  @Column({ type: 'varchar' })
  reason: ReportReason;
}
