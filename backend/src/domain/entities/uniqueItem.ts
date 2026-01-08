import { DefaultItem } from './defaultItem';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity()
export class UniqueItem extends DefaultItem {
  @Column({ type: 'integer' })
  pointsSpent: number;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
