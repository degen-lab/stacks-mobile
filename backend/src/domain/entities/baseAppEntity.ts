import { PrimaryGeneratedColumn } from 'typeorm';

export abstract class BaseAppEntity {
  @PrimaryGeneratedColumn()
  id: number;
}
