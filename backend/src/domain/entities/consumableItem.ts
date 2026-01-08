import { InsuficientQuantityError } from '../errors/itemsErrors';
import { DefaultItem } from './defaultItem';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity()
export class ConsumableItem extends DefaultItem {
  @Column({ type: 'integer' })
  quantity: number;
  @Column({ type: 'integer' })
  pointsPerUnit: number;

  increment() {
    this.quantity += 1;
  }

  consume() {
    if (this.quantity === 0) {
      throw new InsuficientQuantityError();
    }
    this.quantity -= 1;
  }
}
