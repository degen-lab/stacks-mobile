import { Column, Entity } from 'typeorm';
import { BaseAppEntity } from './baseAppEntity';
import { TournamentStatusEnum } from './enums';

@Entity()
export class TournamentStatus extends BaseAppEntity {
  @Column({ type: 'bigint' })
  tournamentId: number;
  @Column({ type: 'enum', enum: TournamentStatusEnum })
  status: TournamentStatusEnum;

  advancePhase() {
    if (this.status === TournamentStatusEnum.SubmitPhase) {
      this.status = TournamentStatusEnum.FinishSubmissionsPhase;
    } else if (this.status === TournamentStatusEnum.FinishSubmissionsPhase) {
      this.status = TournamentStatusEnum.DistributionPhase;
    } else if (this.status === TournamentStatusEnum.DistributionPhase) {
      this.status = TournamentStatusEnum.HeadToNextTournament;
    }
  }

  resetTournament(tournamentId: number) {
    this.tournamentId = tournamentId;
    this.status = TournamentStatusEnum.SubmitPhase;
  }
}
