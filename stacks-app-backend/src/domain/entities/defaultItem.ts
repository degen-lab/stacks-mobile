import { BaseAppEntity } from './baseAppEntity';
import { Column, Entity, ManyToOne, TableInheritance } from 'typeorm';
import { ItemType, PurchaseType } from './enums';
import { User } from './user';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'discriminator' } })
export abstract class DefaultItem extends BaseAppEntity {
  @Column({ type: 'text' })
  name: string;
  @Column({ type: 'enum', enum: ItemType })
  type: ItemType;
  @Column({ type: 'text', nullable: true })
  description?: string;
  @Column({ type: 'enum', enum: PurchaseType })
  purchaseType: PurchaseType;
  @Column({ type: 'json', nullable: true })
  metadata?: object;
  @ManyToOne(() => User, (user) => user.items, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
}
