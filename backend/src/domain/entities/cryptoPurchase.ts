import { BaseAppEntity } from './baseAppEntity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
export class CryptoPurchase extends BaseAppEntity {
  @Column({ type: 'text' })
  @Index()
  orderId: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  @Column({ type: 'text' })
  cryptoCurrencyCode: string;
  @Column({ type: 'text' })
  fiatCurrency: string;
  @Column({ type: 'text', nullable: true })
  status: string;
  @Column({ type: 'bigint', nullable: true })
  fiatAmount: number;
  @Column({ type: 'bigint', nullable: true })
  tokensReceived: number;
  @ManyToOne(() => User, (user) => user.transactions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
}
