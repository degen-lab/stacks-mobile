import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseAppEntity } from './baseAppEntity';
import { FraudReason, GameSession } from '../../shared/types';
import { User } from './user';
@Entity()
export class FraudAttempt extends BaseAppEntity {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  @Column({ type: 'varchar' })
  fraudReason: FraudReason;
  @Column({ type: 'json' })
  fraudData: GameSession;
  @ManyToOne(() => User, (user) => user.fraudAttempts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
}
