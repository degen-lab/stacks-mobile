import { BaseAppEntity } from './baseAppEntity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Submission } from './submission';

@Entity()
export class RewardsDistributionData extends BaseAppEntity {
  @Column({ type: 'bigint' })
  tournamentId: number;
  @Column({ type: 'text' })
  transactionId: string;

  // Unidirectional OneToMany: RewardsDistributionData has many Submissions,
  // but Submission doesn't reference back to RewardsDistributionData
  // Note: TypeORM doesn't support @OneToMany with @JoinTable directly.
  // We use @ManyToMany with @JoinTable to create a join table.
  // To enforce OneToMany semantics (one submission -> one RewardsDistributionData),
  // you'll need to add a UNIQUE constraint on submissionId in the join table via migration.
  @ManyToMany(() => Submission)
  @JoinTable({
    name: 'rewards_distribution_data_submissions',
    joinColumn: {
      name: 'rewardsDistributionDataId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'submissionId',
      referencedColumnName: 'id',
    },
  })
  rewardedSubmissions: Submission[];
}
